package dev.vinisebold.hort.config;

import dev.vinisebold.hort.model.FormaPagamento;
import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.FormaPagamentoRepository;
import dev.vinisebold.hort.repository.NaturezaOperacaoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Inicializa dados padrão do sistema na primeira execução.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final NaturezaOperacaoRepository naturezaOperacaoRepository;
    private final FormaPagamentoRepository formaPagamentoRepository;
    private final UnidadeMedidaRepository unidadeMedidaRepository;

    @Override
    public void run(String... args) {
        log.info("Verificando dados iniciais...");
        
        inicializarNaturezasOperacao();
        inicializarFormasPagamento();
        inicializarUnidadesMedida();
        
        log.info("Dados iniciais verificados com sucesso.");
    }

    private void inicializarNaturezasOperacao() {
        if (naturezaOperacaoRepository.count() == 0) {
            log.info("Inicializando naturezas de operação...");
            
            naturezaOperacaoRepository.save(createNatureza(1, "Venda de Mercadoria", "SAIDA", true));
            naturezaOperacaoRepository.save(createNatureza(2, "Compra de Mercadoria", "ENTRADA", true));
            naturezaOperacaoRepository.save(createNatureza(3, "Devolução", "SAIDA", false));
            naturezaOperacaoRepository.save(createNatureza(4, "Estorno", "ENTRADA", false));
            
            log.info("4 naturezas de operação inseridas.");
        }
    }

    private void inicializarFormasPagamento() {
        if (formaPagamentoRepository.count() == 0) {
            log.info("Inicializando formas de pagamento...");
            
            formaPagamentoRepository.save(createFormaPagamento("Dinheiro - À Vista", false, false));
            formaPagamentoRepository.save(createFormaPagamento("Dinheiro - Fiado", true, false));
            
            log.info("2 formas de pagamento inseridas.");
        }
    }

    private void inicializarUnidadesMedida() {
        if (unidadeMedidaRepository.count() == 0) {
            log.info("Inicializando unidades de medida...");
            
            unidadeMedidaRepository.save(createUnidadeMedida("KG", "Quilograma"));
            unidadeMedidaRepository.save(createUnidadeMedida("SACO", "Saco"));
            unidadeMedidaRepository.save(createUnidadeMedida("UN", "Unidade"));
            
            log.info("3 unidades de medida inseridas.");
        }
    }

    private NaturezaOperacao createNatureza(Integer id, String descricao, String tipoMovimento, Boolean geraFinanceiro) {
        NaturezaOperacao natureza = new NaturezaOperacao();
        natureza.setId(id);
        natureza.setDescricao(descricao);
        natureza.setTipoMovimento(tipoMovimento);
        natureza.setGeraFinanceiro(geraFinanceiro);
        return natureza;
    }

    private FormaPagamento createFormaPagamento(String descricao, Boolean exigeCliente, Boolean exigeDocumentoReferencia) {
        FormaPagamento forma = new FormaPagamento();
        forma.setDescricao(descricao);
        forma.setExigeCliente(exigeCliente);
        forma.setExigeDocumentoReferencia(exigeDocumentoReferencia);
        forma.setIsActive(true);
        return forma;
    }

    private UnidadeMedida createUnidadeMedida(String sigla, String descricao) {
        UnidadeMedida unidade = new UnidadeMedida();
        unidade.setSigla(sigla);
        unidade.setDescricao(descricao);
        unidade.setIsActive(true);
        return unidade;
    }
}
