package dev.vinisebold.hort.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dev.vinisebold.hort.dto.request.UnidadeMedidaRequest;
import dev.vinisebold.hort.dto.response.UnidadeMedidaResponse;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UnidadeMedidaServiceTest {

  @Mock
  private UnidadeMedidaRepository repository;

  @InjectMocks
  private UnidadeMedidaService service;

  private UnidadeMedida unidadeMedida;
  private UnidadeMedidaRequest request;

  @BeforeEach
  void setUp() {
    unidadeMedida = new UnidadeMedida(1, "KG", "Quilograma", true);

    request = new UnidadeMedidaRequest();
    request.setSigla("KG");
    request.setDescricao("Quilograma");
  }

  @Nested
  @DisplayName("criar")
  class Criar {

    @Test
    @DisplayName("deve criar unidade de medida com sucesso")
    void deveCriarUnidadeMedidaComSucesso() {
      when(repository.existsBySigla("KG")).thenReturn(false);
      when(repository.save(any(UnidadeMedida.class))).thenReturn(unidadeMedida);

      UnidadeMedidaResponse response = service.criar(request);

      assertThat(response).isNotNull();
      assertThat(response.getId()).isEqualTo(1);
      assertThat(response.getSigla()).isEqualTo("KG");
      assertThat(response.getDescricao()).isEqualTo("Quilograma");
      assertThat(response.getIsActive()).isTrue();

      verify(repository).existsBySigla("KG");
      verify(repository).save(any(UnidadeMedida.class));
    }

    @Test
    @DisplayName("deve lancar excecao quando sigla ja existe")
    void deveLancarExcecaoQuandoSiglaJaExiste() {
      when(repository.existsBySigla("KG")).thenReturn(true);

      assertThatThrownBy(() -> service.criar(request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Já existe uma Unidade de Medida com esta sigla.");

      verify(repository).existsBySigla("KG");
      verify(repository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("listarAtivos")
  class ListarAtivos {

    @Test
    @DisplayName("deve listar unidades de medida ativas")
    void deveListarUnidadesMedidaAtivas() {
      UnidadeMedida um2 = new UnidadeMedida(2, "CX", "Caixa", true);

      when(repository.findAllByIsActiveTrue()).thenReturn(List.of(unidadeMedida, um2));

      List<UnidadeMedidaResponse> result = service.listarAtivos();

      assertThat(result).hasSize(2);
      assertThat(result.get(0).getSigla()).isEqualTo("KG");
      assertThat(result.get(0).getDescricao()).isEqualTo("Quilograma");
      assertThat(result.get(1).getSigla()).isEqualTo("CX");
      assertThat(result.get(1).getDescricao()).isEqualTo("Caixa");

      verify(repository).findAllByIsActiveTrue();
    }

    @Test
    @DisplayName("deve retornar lista vazia quando nao houver ativos")
    void deveRetornarListaVaziaQuandoNaoHouverAtivos() {
      when(repository.findAllByIsActiveTrue()).thenReturn(Collections.emptyList());

      List<UnidadeMedidaResponse> result = service.listarAtivos();

      assertThat(result).isEmpty();

      verify(repository).findAllByIsActiveTrue();
    }
  }

  @Nested
  @DisplayName("buscarPorId")
  class BuscarPorId {

    @Test
    @DisplayName("deve buscar unidade de medida por id com sucesso")
    void deveBuscarPorIdComSucesso() {
      when(repository.findById(1)).thenReturn(Optional.of(unidadeMedida));

      UnidadeMedidaResponse response = service.buscarPorId(1);

      assertThat(response).isNotNull();
      assertThat(response.getId()).isEqualTo(1);
      assertThat(response.getSigla()).isEqualTo("KG");
      assertThat(response.getDescricao()).isEqualTo("Quilograma");
      assertThat(response.getIsActive()).isTrue();

      verify(repository).findById(1);
    }

    @Test
    @DisplayName("deve lancar excecao quando nao encontrada")
    void deveLancarExcecaoQuandoNaoEncontrada() {
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
    @DisplayName("deve atualizar unidade de medida com sucesso")
    void deveAtualizarComSucesso() {
      UnidadeMedidaRequest updateRequest = new UnidadeMedidaRequest();
      updateRequest.setSigla("UN");
      updateRequest.setDescricao("Unidade");

      UnidadeMedida umAtualizada = new UnidadeMedida(1, "UN", "Unidade", true);

      when(repository.findById(1)).thenReturn(Optional.of(unidadeMedida));
      when(repository.existsBySigla("UN")).thenReturn(false);
      when(repository.save(any(UnidadeMedida.class))).thenReturn(umAtualizada);

      UnidadeMedidaResponse response = service.atualizar(1, updateRequest);

      assertThat(response).isNotNull();
      assertThat(response.getSigla()).isEqualTo("UN");
      assertThat(response.getDescricao()).isEqualTo("Unidade");
      assertThat(response.getIsActive()).isTrue();

      verify(repository).findById(1);
      verify(repository).existsBySigla("UN");
      verify(repository).save(any(UnidadeMedida.class));
    }

    @Test
    @DisplayName("deve lancar excecao quando sigla duplicada ao atualizar")
    void deveLancarExcecaoQuandoSiglaDuplicadaAoAtualizar() {
      UnidadeMedidaRequest updateRequest = new UnidadeMedidaRequest();
      updateRequest.setSigla("CX");
      updateRequest.setDescricao("Caixa");

      when(repository.findById(1)).thenReturn(Optional.of(unidadeMedida));
      when(repository.existsBySigla("CX")).thenReturn(true);

      assertThatThrownBy(() -> service.atualizar(1, updateRequest))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Já existe uma Unidade de Medida com esta sigla.");

      verify(repository).findById(1);
      verify(repository).existsBySigla("CX");
      verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("deve permitir atualizar mantendo a mesma sigla")
    void devePermitirAtualizarMantendoMesmaSigla() {
      UnidadeMedidaRequest updateRequest = new UnidadeMedidaRequest();
      updateRequest.setSigla("KG");
      updateRequest.setDescricao("Quilograma atualizado");

      UnidadeMedida umAtualizada = new UnidadeMedida(1, "KG", "Quilograma atualizado", true);

      when(repository.findById(1)).thenReturn(Optional.of(unidadeMedida));
      when(repository.save(any(UnidadeMedida.class))).thenReturn(umAtualizada);

      UnidadeMedidaResponse response = service.atualizar(1, updateRequest);

      assertThat(response).isNotNull();
      assertThat(response.getSigla()).isEqualTo("KG");
      assertThat(response.getDescricao()).isEqualTo("Quilograma atualizado");

      verify(repository).findById(1);
      verify(repository, never()).existsBySigla(any());
      verify(repository).save(any(UnidadeMedida.class));
    }

    @Test
    @DisplayName("deve lancar excecao quando nao encontrada ao atualizar")
    void deveLancarExcecaoQuandoNaoEncontradaAoAtualizar() {
      when(repository.findById(99)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.atualizar(99, request))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Não encontrado.");

      verify(repository).findById(99);
      verify(repository, never()).existsBySigla(any());
      verify(repository, never()).save(any());
    }
  }

  @Nested
  @DisplayName("deletar")
  class Deletar {

    @Test
    @DisplayName("deve realizar soft delete com sucesso")
    void deveRealizarSoftDeleteComSucesso() {
      when(repository.findById(1)).thenReturn(Optional.of(unidadeMedida));
      when(repository.save(any(UnidadeMedida.class))).thenReturn(unidadeMedida);

      service.deletar(1);

      assertThat(unidadeMedida.getIsActive()).isFalse();

      verify(repository).findById(1);
      verify(repository).save(unidadeMedida);
    }

    @Test
    @DisplayName("deve lancar excecao quando nao encontrada ao deletar")
    void deveLancarExcecaoQuandoNaoEncontradaAoDeletar() {
      when(repository.findById(99)).thenReturn(Optional.empty());

      assertThatThrownBy(() -> service.deletar(99))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessage("Não encontrado.");

      verify(repository).findById(99);
      verify(repository, never()).save(any());
    }
  }
}
