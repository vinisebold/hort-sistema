package dev.vinisebold.hort.config;

import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.model.TipoMovimento;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.NaturezaOperacaoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
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
    private final UnidadeMedidaRepository unidadeMedidaRepository;

    @Override
    public void run(String @NonNull ... args) {
        log.info("Verificando dados iniciais...");
        
        inicializarNaturezasOperacao();
        inicializarUnidadesMedida();
        
        log.info("Dados iniciais verificados com sucesso.");
    }

    private void inicializarNaturezasOperacao() {
        if (naturezaOperacaoRepository.count() == 0) {
            log.info("Inicializando naturezas de operação...");
            
            naturezaOperacaoRepository.save(createNatureza("Venda de Mercadoria", TipoMovimento.SAIDA, true));
            naturezaOperacaoRepository.save(createNatureza("Compra de Mercadoria", TipoMovimento.ENTRADA, true));
            naturezaOperacaoRepository.save(createNatureza("Devolução", TipoMovimento.SAIDA, false));
            naturezaOperacaoRepository.save(createNatureza("Estorno", TipoMovimento.ENTRADA, false));
            
            log.info("4 naturezas de operação inseridas.");
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

    private NaturezaOperacao createNatureza(String descricao, TipoMovimento tipoMovimento, Boolean geraFinanceiro) {
        NaturezaOperacao natureza = new NaturezaOperacao();
        natureza.setDescricao(descricao);
        natureza.setTipoMovimento(tipoMovimento);
        natureza.setGeraFinanceiro(geraFinanceiro);
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
