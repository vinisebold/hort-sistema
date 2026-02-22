package dev.vinisebold.hort.service;

import dev.vinisebold.hort.model.ItemPedido;
import dev.vinisebold.hort.model.LoteEntrada;
import dev.vinisebold.hort.model.LoteSaida;
import dev.vinisebold.hort.repository.LoteEntradaRepository;
import dev.vinisebold.hort.repository.LoteSaidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FifoService {

    private final LoteEntradaRepository loteEntradaRepository;
    private final LoteSaidaRepository loteSaidaRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void registrarLoteCompra(ItemPedido itemCompra) {
        LoteEntrada lote = new LoteEntrada();
        lote.setItemPedido(itemCompra);
        lote.setProduto(itemCompra.getProduto());
        lote.setQuantidadeOriginal(itemCompra.getQuantidade());
        lote.setQuantidadeDisponivel(itemCompra.getQuantidade());
        lote.setCustoUnitario(itemCompra.getValorUnitario()); // Na compra, o custo é o preço pago

        // Se a data de emissão ainda não foi gerada pelo banco, usa o momento atual
        LocalDateTime dataLote = itemCompra.getPedido().getDataEmissao() != null
                ? itemCompra.getPedido().getDataEmissao() : LocalDateTime.now();
        lote.setDataEntrada(dataLote);

        lote.setIsEsgotado(false);
        loteEntradaRepository.save(lote);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public BigDecimal processarVendaFifo(ItemPedido itemVenda) {
        BigDecimal quantidadeRestante = itemVenda.getQuantidade();
        BigDecimal custoTotalDaVenda = BigDecimal.ZERO;

        // Busca os lotes mais velhos que ainda têm saldo
        List<LoteEntrada> lotesAtivos = loteEntradaRepository
                .findByProdutoAndIsEsgotadoFalseOrderByDataEntradaAsc(itemVenda.getProduto());

        for (LoteEntrada lote : lotesAtivos) {
            if (quantidadeRestante.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal quantidadeConsumidaNesteLote;

            if (lote.getQuantidadeDisponivel().compareTo(quantidadeRestante) <= 0) {
                // O pedido engole o resto inteiro deste lote
                quantidadeConsumidaNesteLote = lote.getQuantidadeDisponivel();
                lote.setQuantidadeDisponivel(BigDecimal.ZERO);
                lote.setIsEsgotado(true);
            } else {
                // O lote é grande o suficiente, consumimos só um pedaço
                quantidadeConsumidaNesteLote = quantidadeRestante;
                lote.setQuantidadeDisponivel(lote.getQuantidadeDisponivel().subtract(quantidadeRestante));
            }

            quantidadeRestante = quantidadeRestante.subtract(quantidadeConsumidaNesteLote);

            // Valor consumido = Qtd Tirada * Custo original do Lote
            BigDecimal custoDesteConsumo = quantidadeConsumidaNesteLote.multiply(lote.getCustoUnitario());
            custoTotalDaVenda = custoTotalDaVenda.add(custoDesteConsumo);

            // A Prova do Crime (Rastreabilidade)
            LoteSaida consumo = new LoteSaida();
            consumo.setLoteEntrada(lote);
            consumo.setItemPedidoVenda(itemVenda);
            consumo.setQuantidadeConsumida(quantidadeConsumidaNesteLote);
            consumo.setCustoUnitario(lote.getCustoUnitario());
            loteSaidaRepository.save(consumo);

            loteEntradaRepository.save(lote);
        }

        if (quantidadeRestante.compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Erro de Inconsistência FIFO: Estoque contábil insuficiente para o produto " + itemVenda.getProduto().getDescricao() + ". Verifique se houve vendas sem entrada.");
        }

        // Retorna o Custo Médio Ponderado exato para gravar na linha da venda
        return custoTotalDaVenda.divide(itemVenda.getQuantidade(), 2, RoundingMode.HALF_UP);
    }
}