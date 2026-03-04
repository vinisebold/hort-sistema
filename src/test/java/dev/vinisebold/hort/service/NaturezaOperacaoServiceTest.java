package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.NaturezaOperacaoRequest;
import dev.vinisebold.hort.dto.response.NaturezaOperacaoResponse;
import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.model.TipoMovimento;
import dev.vinisebold.hort.repository.NaturezaOperacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NaturezaOperacaoServiceTest {

    @Mock
    private NaturezaOperacaoRepository repository;

    @InjectMocks
    private NaturezaOperacaoService service;

    private NaturezaOperacao naturezaOperacao;
    private NaturezaOperacaoRequest request;

    @BeforeEach
    void setUp() {
        naturezaOperacao = new NaturezaOperacao();
        naturezaOperacao.setId(1);
        naturezaOperacao.setDescricao("Compra");
        naturezaOperacao.setTipoMovimento(TipoMovimento.ENTRADA);
        naturezaOperacao.setExigeCliente(true);
        naturezaOperacao.setExigeValorUnitario(true);
        naturezaOperacao.setExigeStatus(true);

        request = new NaturezaOperacaoRequest();
        request.setDescricao("Compra");
        request.setTipoMovimento(TipoMovimento.ENTRADA);
        request.setExigeCliente(true);
        request.setExigeValorUnitario(true);
        request.setExigeStatus(true);
    }

    @Nested
    @DisplayName("criar")
    class Criar {

        @Test
        @DisplayName("deve criar natureza de operacao com sucesso")
        void deveCriarNaturezaOperacaoComSucesso() {
            when(repository.existsByDescricao("Compra")).thenReturn(false);
            when(repository.save(any(NaturezaOperacao.class))).thenReturn(naturezaOperacao);

            NaturezaOperacaoResponse response = service.criar(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getDescricao()).isEqualTo("Compra");
            assertThat(response.getTipoMovimento()).isEqualTo(TipoMovimento.ENTRADA);
            assertThat(response.getExigeCliente()).isTrue();
            assertThat(response.getExigeValorUnitario()).isTrue();
            assertThat(response.getExigeStatus()).isTrue();

            verify(repository).existsByDescricao("Compra");
            verify(repository).save(any(NaturezaOperacao.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando descricao ja existe")
        void deveLancarExcecaoQuandoDescricaoJaExiste() {
            when(repository.existsByDescricao("Compra")).thenReturn(true);

            assertThatThrownBy(() -> service.criar(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe uma Natureza de Operação com esta descrição.");

            verify(repository).existsByDescricao("Compra");
            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("listarTodos")
    class ListarTodos {

        @Test
        @DisplayName("deve listar todas as naturezas de operacao")
        void deveListarTodasNaturezasOperacao() {
            NaturezaOperacao no2 = new NaturezaOperacao();
            no2.setId(2);
            no2.setDescricao("Venda");
            no2.setTipoMovimento(TipoMovimento.SAIDA);
            no2.setExigeCliente(true);
            no2.setExigeValorUnitario(true);
            no2.setExigeStatus(true);

            when(repository.findAll()).thenReturn(List.of(naturezaOperacao, no2));

            List<NaturezaOperacaoResponse> result = service.listarTodos();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getDescricao()).isEqualTo("Compra");
            assertThat(result.get(0).getTipoMovimento()).isEqualTo(TipoMovimento.ENTRADA);
            assertThat(result.get(1).getDescricao()).isEqualTo("Venda");
            assertThat(result.get(1).getTipoMovimento()).isEqualTo(TipoMovimento.SAIDA);

            verify(repository).findAll();
        }

        @Test
        @DisplayName("deve retornar lista vazia quando nao houver registros")
        void deveRetornarListaVaziaQuandoNaoHouverRegistros() {
            when(repository.findAll()).thenReturn(Collections.emptyList());

            List<NaturezaOperacaoResponse> result = service.listarTodos();

            assertThat(result).isEmpty();

            verify(repository).findAll();
        }
    }

    @Nested
    @DisplayName("buscarPorId")
    class BuscarPorId {

        @Test
        @DisplayName("deve buscar natureza de operacao por id com sucesso")
        void deveBuscarPorIdComSucesso() {
            when(repository.findById(1)).thenReturn(Optional.of(naturezaOperacao));

            NaturezaOperacaoResponse response = service.buscarPorId(1);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getDescricao()).isEqualTo("Compra");
            assertThat(response.getTipoMovimento()).isEqualTo(TipoMovimento.ENTRADA);
            assertThat(response.getExigeCliente()).isTrue();
            assertThat(response.getExigeValorUnitario()).isTrue();
            assertThat(response.getExigeStatus()).isTrue();

            verify(repository).findById(1);
        }

        @Test
        @DisplayName("deve lancar excecao quando nao encontrada")
        void deveLancarExcecaoQuandoNaoEncontrada() {
            when(repository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.buscarPorId(99))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Natureza de Operação não encontrada.");

            verify(repository).findById(99);
        }
    }

    @Nested
    @DisplayName("atualizar")
    class Atualizar {

        @Test
        @DisplayName("deve atualizar natureza de operacao com sucesso")
        void deveAtualizarComSucesso() {
            NaturezaOperacaoRequest updateRequest = new NaturezaOperacaoRequest();
            updateRequest.setDescricao("Devolução");
            updateRequest.setTipoMovimento(TipoMovimento.SAIDA);
            updateRequest.setExigeCliente(false);
            updateRequest.setExigeValorUnitario(false);
            updateRequest.setExigeStatus(false);

            NaturezaOperacao noAtualizada = new NaturezaOperacao();
            noAtualizada.setId(1);
            noAtualizada.setDescricao("Devolução");
            noAtualizada.setTipoMovimento(TipoMovimento.SAIDA);
            noAtualizada.setExigeCliente(false);
            noAtualizada.setExigeValorUnitario(false);
            noAtualizada.setExigeStatus(false);

            when(repository.findById(1)).thenReturn(Optional.of(naturezaOperacao));
            when(repository.existsByDescricao("Devolução")).thenReturn(false);
            when(repository.save(any(NaturezaOperacao.class))).thenReturn(noAtualizada);

            NaturezaOperacaoResponse response = service.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getDescricao()).isEqualTo("Devolução");
            assertThat(response.getTipoMovimento()).isEqualTo(TipoMovimento.SAIDA);
            assertThat(response.getExigeCliente()).isFalse();
            assertThat(response.getExigeValorUnitario()).isFalse();
            assertThat(response.getExigeStatus()).isFalse();

            verify(repository).findById(1);
            verify(repository).existsByDescricao("Devolução");
            verify(repository).save(any(NaturezaOperacao.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando descricao duplicada ao atualizar")
        void deveLancarExcecaoQuandoDescricaoDuplicadaAoAtualizar() {
            NaturezaOperacaoRequest updateRequest = new NaturezaOperacaoRequest();
            updateRequest.setDescricao("Venda");
            updateRequest.setTipoMovimento(TipoMovimento.SAIDA);
            updateRequest.setExigeCliente(true);
            updateRequest.setExigeValorUnitario(true);
            updateRequest.setExigeStatus(true);

            when(repository.findById(1)).thenReturn(Optional.of(naturezaOperacao));
            when(repository.existsByDescricao("Venda")).thenReturn(true);

            assertThatThrownBy(() -> service.atualizar(1, updateRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe uma Natureza de Operação com esta descrição.");

            verify(repository).findById(1);
            verify(repository).existsByDescricao("Venda");
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("deve permitir atualizar mantendo a mesma descricao")
        void devePermitirAtualizarMantendoMesmaDescricao() {
            NaturezaOperacaoRequest updateRequest = new NaturezaOperacaoRequest();
            updateRequest.setDescricao("Compra");
            updateRequest.setTipoMovimento(TipoMovimento.ENTRADA);
            updateRequest.setExigeCliente(true);
            updateRequest.setExigeValorUnitario(true);
            updateRequest.setExigeStatus(false);

            NaturezaOperacao noAtualizada = new NaturezaOperacao();
            noAtualizada.setId(1);
            noAtualizada.setDescricao("Compra");
            noAtualizada.setTipoMovimento(TipoMovimento.ENTRADA);
            noAtualizada.setExigeCliente(true);
            noAtualizada.setExigeValorUnitario(true);
            noAtualizada.setExigeStatus(false);

            when(repository.findById(1)).thenReturn(Optional.of(naturezaOperacao));
            when(repository.save(any(NaturezaOperacao.class))).thenReturn(noAtualizada);

            NaturezaOperacaoResponse response = service.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getDescricao()).isEqualTo("Compra");
            assertThat(response.getExigeCliente()).isTrue();
            assertThat(response.getExigeValorUnitario()).isTrue();
            assertThat(response.getExigeStatus()).isFalse();

            verify(repository).findById(1);
            verify(repository, never()).existsByDescricao(any());
            verify(repository).save(any(NaturezaOperacao.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando nao encontrada ao atualizar")
        void deveLancarExcecaoQuandoNaoEncontradaAoAtualizar() {
            when(repository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.atualizar(99, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Natureza de Operação não encontrada.");

            verify(repository).findById(99);
            verify(repository, never()).existsByDescricao(any());
            verify(repository, never()).save(any());
        }
    }
}
