package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.FormaPagamentoRequest;
import dev.vinisebold.hort.dto.response.FormaPagamentoResponse;
import dev.vinisebold.hort.model.FormaPagamento;
import dev.vinisebold.hort.repository.FormaPagamentoRepository;
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
class FormaPagamentoServiceTest {

    @Mock
    private FormaPagamentoRepository repository;

    @InjectMocks
    private FormaPagamentoService service;

    private FormaPagamento formaPagamento;
    private FormaPagamentoRequest request;

    @BeforeEach
    void setUp() {
        formaPagamento = new FormaPagamento();
        formaPagamento.setId(1);
        formaPagamento.setDescricao("Dinheiro");
        formaPagamento.setExigeCliente(false);
        formaPagamento.setExigeDocumentoReferencia(false);
        formaPagamento.setIsActive(true);

        request = new FormaPagamentoRequest();
        request.setDescricao("Dinheiro");
        request.setExigeCliente(false);
        request.setExigeDocumentoReferencia(false);
    }

    @Nested
    @DisplayName("criar")
    class Criar {

        @Test
        @DisplayName("deve criar forma de pagamento com sucesso")
        void deveCriarFormaPagamentoComSucesso() {
            when(repository.existsByDescricao("Dinheiro")).thenReturn(false);
            when(repository.save(any(FormaPagamento.class))).thenReturn(formaPagamento);

            FormaPagamentoResponse response = service.criar(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getDescricao()).isEqualTo("Dinheiro");
            assertThat(response.getExigeCliente()).isFalse();
            assertThat(response.getExigeDocumentoReferencia()).isFalse();
            assertThat(response.getIsActive()).isTrue();

            verify(repository).existsByDescricao("Dinheiro");
            verify(repository).save(any(FormaPagamento.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando descricao ja existe")
        void deveLancarExcecaoQuandoDescricaoJaExiste() {
            when(repository.existsByDescricao("Dinheiro")).thenReturn(true);

            assertThatThrownBy(() -> service.criar(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe uma Forma de Pagamento com esta descrição.");

            verify(repository).existsByDescricao("Dinheiro");
            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("listarAtivos")
    class ListarAtivos {

        @Test
        @DisplayName("deve listar formas de pagamento ativas")
        void deveListarFormasPagamentoAtivas() {
            FormaPagamento fp2 = new FormaPagamento();
            fp2.setId(2);
            fp2.setDescricao("Cartão");
            fp2.setExigeCliente(true);
            fp2.setExigeDocumentoReferencia(false);
            fp2.setIsActive(true);

            when(repository.findAllByIsActiveTrue()).thenReturn(List.of(formaPagamento, fp2));

            List<FormaPagamentoResponse> result = service.listarAtivos();

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getDescricao()).isEqualTo("Dinheiro");
            assertThat(result.get(1).getDescricao()).isEqualTo("Cartão");

            verify(repository).findAllByIsActiveTrue();
        }

        @Test
        @DisplayName("deve retornar lista vazia quando nao houver ativos")
        void deveRetornarListaVaziaQuandoNaoHouverAtivos() {
            when(repository.findAllByIsActiveTrue()).thenReturn(Collections.emptyList());

            List<FormaPagamentoResponse> result = service.listarAtivos();

            assertThat(result).isEmpty();

            verify(repository).findAllByIsActiveTrue();
        }
    }

    @Nested
    @DisplayName("buscarPorId")
    class BuscarPorId {

        @Test
        @DisplayName("deve buscar forma de pagamento por id com sucesso")
        void deveBuscarPorIdComSucesso() {
            when(repository.findById(1)).thenReturn(Optional.of(formaPagamento));

            FormaPagamentoResponse response = service.buscarPorId(1);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getDescricao()).isEqualTo("Dinheiro");
            assertThat(response.getExigeCliente()).isFalse();
            assertThat(response.getExigeDocumentoReferencia()).isFalse();
            assertThat(response.getIsActive()).isTrue();

            verify(repository).findById(1);
        }

        @Test
        @DisplayName("deve lancar excecao quando nao encontrado")
        void deveLancarExcecaoQuandoNaoEncontrado() {
            when(repository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.buscarPorId(99))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Não encontrado.");

            verify(repository).findById(99);
        }
    }

    @Nested
    @DisplayName("atualizar")
    class Atualizar {

        @Test
        @DisplayName("deve atualizar forma de pagamento com sucesso")
        void deveAtualizarComSucesso() {
            FormaPagamentoRequest updateRequest = new FormaPagamentoRequest();
            updateRequest.setDescricao("Cartão de Crédito");
            updateRequest.setExigeCliente(true);
            updateRequest.setExigeDocumentoReferencia(true);

            FormaPagamento fpAtualizada = new FormaPagamento();
            fpAtualizada.setId(1);
            fpAtualizada.setDescricao("Cartão de Crédito");
            fpAtualizada.setExigeCliente(true);
            fpAtualizada.setExigeDocumentoReferencia(true);
            fpAtualizada.setIsActive(true);

            when(repository.findById(1)).thenReturn(Optional.of(formaPagamento));
            when(repository.existsByDescricao("Cartão de Crédito")).thenReturn(false);
            when(repository.save(any(FormaPagamento.class))).thenReturn(fpAtualizada);

            FormaPagamentoResponse response = service.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getDescricao()).isEqualTo("Cartão de Crédito");
            assertThat(response.getExigeCliente()).isTrue();
            assertThat(response.getExigeDocumentoReferencia()).isTrue();

            verify(repository).findById(1);
            verify(repository).existsByDescricao("Cartão de Crédito");
            verify(repository).save(any(FormaPagamento.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando descricao duplicada ao atualizar")
        void deveLancarExcecaoQuandoDescricaoDuplicadaAoAtualizar() {
            FormaPagamentoRequest updateRequest = new FormaPagamentoRequest();
            updateRequest.setDescricao("Cartão");
            updateRequest.setExigeCliente(true);
            updateRequest.setExigeDocumentoReferencia(false);

            when(repository.findById(1)).thenReturn(Optional.of(formaPagamento));
            when(repository.existsByDescricao("Cartão")).thenReturn(true);

            assertThatThrownBy(() -> service.atualizar(1, updateRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe uma Forma de Pagamento com esta descrição.");

            verify(repository).findById(1);
            verify(repository).existsByDescricao("Cartão");
            verify(repository, never()).save(any());
        }

        @Test
        @DisplayName("deve permitir atualizar mantendo a mesma descricao")
        void devePermitirAtualizarMantendoMesmaDescricao() {
            FormaPagamentoRequest updateRequest = new FormaPagamentoRequest();
            updateRequest.setDescricao("Dinheiro");
            updateRequest.setExigeCliente(true);
            updateRequest.setExigeDocumentoReferencia(true);

            FormaPagamento fpAtualizada = new FormaPagamento();
            fpAtualizada.setId(1);
            fpAtualizada.setDescricao("Dinheiro");
            fpAtualizada.setExigeCliente(true);
            fpAtualizada.setExigeDocumentoReferencia(true);
            fpAtualizada.setIsActive(true);

            when(repository.findById(1)).thenReturn(Optional.of(formaPagamento));
            when(repository.save(any(FormaPagamento.class))).thenReturn(fpAtualizada);

            FormaPagamentoResponse response = service.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getDescricao()).isEqualTo("Dinheiro");
            assertThat(response.getExigeCliente()).isTrue();

            verify(repository).findById(1);
            verify(repository, never()).existsByDescricao(any());
            verify(repository).save(any(FormaPagamento.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando nao encontrado ao atualizar")
        void deveLancarExcecaoQuandoNaoEncontradoAoAtualizar() {
            when(repository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.atualizar(99, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Não encontrado.");

            verify(repository).findById(99);
            verify(repository, never()).existsByDescricao(any());
            verify(repository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deletar")
    class Deletar {

        @Test
        @DisplayName("deve realizar soft delete com sucesso")
        void deveRealizarSoftDeleteComSucesso() {
            when(repository.findById(1)).thenReturn(Optional.of(formaPagamento));
            when(repository.save(any(FormaPagamento.class))).thenReturn(formaPagamento);

            service.deletar(1);

            assertThat(formaPagamento.getIsActive()).isFalse();

            verify(repository).findById(1);
            verify(repository).save(formaPagamento);
        }

        @Test
        @DisplayName("deve lancar excecao quando nao encontrado ao deletar")
        void deveLancarExcecaoQuandoNaoEncontradoAoDeletar() {
            when(repository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.deletar(99))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Não encontrado.");

            verify(repository).findById(99);
            verify(repository, never()).save(any());
        }
    }
}
