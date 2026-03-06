package dev.vinisebold.hort.config;

import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.model.CampoPropriedade;
import dev.vinisebold.hort.model.TipoMovimento;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.NaturezaOperacaoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Inicializa dados padrão do sistema na primeira execução.
 */
@Component
public class DataInitializer {

    private final NaturezaOperacaoRepository naturezaOperacaoRepository;
    private final UnidadeMedidaRepository unidadeMedidaRepository;

    public DataInitializer(NaturezaOperacaoRepository naturezaOperacaoRepository,
                           UnidadeMedidaRepository unidadeMedidaRepository) {
        this.naturezaOperacaoRepository = naturezaOperacaoRepository;
        this.unidadeMedidaRepository = unidadeMedidaRepository;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        System.out.println("Verificando dados iniciais...");
        
        inicializarNaturezasOperacao();
        ajustarNaturezasOperacaoExistentes();
        inicializarUnidadesMedida();
        
        System.out.println("Dados iniciais verificados com sucesso.");
    }

    private void inicializarNaturezasOperacao() {
        if (naturezaOperacaoRepository.count() == 0) {
            System.out.println("Inicializando naturezas de operação...");
            
            naturezaOperacaoRepository.save(createNatureza("Venda de Mercadoria", TipoMovimento.SAIDA,
                    CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.OBRIGATORIO));
            naturezaOperacaoRepository.save(createNatureza("Compra de Mercadoria", TipoMovimento.ENTRADA,
                    CampoPropriedade.DESATIVADO, CampoPropriedade.OBRIGATORIO, CampoPropriedade.DESATIVADO));
            naturezaOperacaoRepository.save(createNatureza("Quebra de Mercadoria", TipoMovimento.SAIDA,
                    CampoPropriedade.DESATIVADO, CampoPropriedade.DESATIVADO, CampoPropriedade.DESATIVADO));
            naturezaOperacaoRepository.save(createNatureza("Ajuste de Entrada", TipoMovimento.ENTRADA,
                    CampoPropriedade.DESATIVADO, CampoPropriedade.DESATIVADO, CampoPropriedade.DESATIVADO));
            
            System.out.println("4 naturezas de operação inseridas.");
        }
    }

    private void inicializarUnidadesMedida() {
        if (unidadeMedidaRepository.count() == 0) {
            System.out.println("Inicializando unidades de medida...");
            
            unidadeMedidaRepository.save(createUnidadeMedida("KG", "Quilograma"));
            unidadeMedidaRepository.save(createUnidadeMedida("SACO", "Saco"));
            unidadeMedidaRepository.save(createUnidadeMedida("UN", "Unidade"));
            
            System.out.println("3 unidades de medida inseridas.");
        }
    }

    private void ajustarNaturezasOperacaoExistentes() {
        naturezaOperacaoRepository.findAll().forEach(natureza -> {
            String descricao = natureza.getDescricao() != null ? natureza.getDescricao().trim() : "";

            if ("Compra de Mercadoria".equalsIgnoreCase(descricao)) {
                natureza.setPropriedadeCliente(CampoPropriedade.DESATIVADO);
                natureza.setPropriedadeValorUnitario(CampoPropriedade.OBRIGATORIO);
                natureza.setPropriedadeStatus(CampoPropriedade.DESATIVADO);
                natureza.setExigeCliente(false);
                natureza.setExigeValorUnitario(true);
                natureza.setExigeStatus(false);
                naturezaOperacaoRepository.save(natureza);
            }
        });
    }

    private NaturezaOperacao createNatureza(String descricao, TipoMovimento tipoMovimento,
                                            CampoPropriedade propriedadeCliente, CampoPropriedade propriedadeValorUnitario,
                                            CampoPropriedade propriedadeStatus) {
        NaturezaOperacao natureza = new NaturezaOperacao();
        natureza.setDescricao(descricao);
        natureza.setTipoMovimento(tipoMovimento);
        natureza.setPropriedadeCliente(propriedadeCliente);
        natureza.setPropriedadeValorUnitario(propriedadeValorUnitario);
        natureza.setPropriedadeStatus(propriedadeStatus);
        natureza.setExigeCliente(CampoPropriedade.OBRIGATORIO.equals(propriedadeCliente));
        natureza.setExigeValorUnitario(CampoPropriedade.OBRIGATORIO.equals(propriedadeValorUnitario));
        natureza.setExigeStatus(CampoPropriedade.OBRIGATORIO.equals(propriedadeStatus));
        return natureza;
    }

    private UnidadeMedida createUnidadeMedida(String sigla, String descricao) {
        UnidadeMedida unidade = new UnidadeMedida();
        unidade.setSigla(sigla);
        unidade.setDescricao(descricao);
        unidade.setIsActive(true);
        return unidade;
    }
}
