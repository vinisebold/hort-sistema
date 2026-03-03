package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ProdutoRequest;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.dto.response.ProdutoResponse;
import dev.vinisebold.hort.dto.response.UnidadeMedidaResponse;
import dev.vinisebold.hort.model.Produto;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.ProdutoRepository;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProdutoServiceTest {

    @Mock
    private ProdutoRepository produtoRepository;

    @Mock
    private UnidadeMedidaRepository unidadeMedidaRepository;

    @Mock
    private UnidadeMedidaService unidadeMedidaService;

    @InjectMocks
    private ProdutoService produtoService;

    private UnidadeMedida unidadeMedida;
    private UnidadeMedidaResponse unidadeMedidaResponse;
    private Produto produto;
    private ProdutoRequest produtoRequest;

    @BeforeEach
    void setUp() {
        unidadeMedida = new UnidadeMedida(1, "KG", "Quilograma", true);

        unidadeMedidaResponse = UnidadeMedidaResponse.builder()
                .id(1)
                .sigla("KG")
                .descricao("Quilograma")
                .isActive(true)
                .build();

        produto = new Produto();
        produto.setId(1);
        produto.setCodigo("P001");
        produto.setDescricao("Tomate");
        produto.setUnidadeMedida(unidadeMedida);
        produto.setEstoqueAtual(BigDecimal.ZERO);
        produto.setIsActive(true);
        produto.setCreatedAt(LocalDateTime.of(2026, 3, 1, 10, 0));

        produtoRequest = new ProdutoRequest();
        produtoRequest.setCodigo("P001");
        produtoRequest.setDescricao("Tomate");
        produtoRequest.setUnidadeMedidaId(1);
    }

    @Nested
    @DisplayName("criar")
    class Criar {

        @Test
        @DisplayName("deve criar produto com sucesso")
        void deveCriarProdutoComSucesso() {
            when(produtoRepository.existsByCodigo("P001")).thenReturn(false);
            when(unidadeMedidaRepository.findById(1)).thenReturn(Optional.of(unidadeMedida));
            when(produtoRepository.save(any(Produto.class))).thenReturn(produto);
            when(unidadeMedidaService.mapToResponse(unidadeMedida)).thenReturn(unidadeMedidaResponse);

            ProdutoResponse response = produtoService.criar(produtoRequest);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getCodigo()).isEqualTo("P001");
            assertThat(response.getDescricao()).isEqualTo("Tomate");
            assertThat(response.getEstoqueAtual()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.getIsActive()).isTrue();
            assertThat(response.getUnidadeMedida()).isEqualTo(unidadeMedidaResponse);

            verify(produtoRepository).existsByCodigo("P001");
            verify(unidadeMedidaRepository).findById(1);
            verify(produtoRepository).save(any(Produto.class));
            verify(unidadeMedidaService).mapToResponse(unidadeMedida);
        }

        @Test
        @DisplayName("deve lancar excecao quando codigo ja existe")
        void deveLancarExcecaoQuandoCodigoJaExiste() {
            when(produtoRepository.existsByCodigo("P001")).thenReturn(true);

            assertThatThrownBy(() -> produtoService.criar(produtoRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe um produto com este código.");

            verify(produtoRepository).existsByCodigo("P001");
            verify(unidadeMedidaRepository, never()).findById(any());
            verify(produtoRepository, never()).save(any());
        }

        @Test
        @DisplayName("deve lancar excecao quando unidade de medida nao encontrada")
        void deveLancarExcecaoQuandoUnidadeMedidaNaoEncontrada() {
            when(produtoRepository.existsByCodigo("P001")).thenReturn(false);
            when(unidadeMedidaRepository.findById(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> produtoService.criar(produtoRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Unidade de Medida inválida.");

            verify(produtoRepository).existsByCodigo("P001");
            verify(unidadeMedidaRepository).findById(1);
            verify(produtoRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("listarAtivos")
    class ListarAtivos {

        @Test
        @DisplayName("deve listar ativos sem cursor")
        void deveListarAtivosSemCursor() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Produto> page = new PageImpl<>(List.of(produto), pageable, 1);

            when(produtoRepository.findAllByIsActiveTrueOrderByIdDesc(pageable)).thenReturn(page);
            when(unidadeMedidaService.mapToResponse(unidadeMedida)).thenReturn(unidadeMedidaResponse);

            CursorResponse<ProdutoResponse> response = produtoService.listarAtivos(null, 10);

            assertThat(response).isNotNull();
            assertThat(response.getData()).hasSize(1);
            assertThat(response.getData().getFirst().getCodigo()).isEqualTo("P001");
            assertThat(response.getNextCursor()).isEqualTo(1);
            assertThat(response.isHasNext()).isFalse();

            verify(produtoRepository).findAllByIsActiveTrueOrderByIdDesc(pageable);
            verify(produtoRepository, never()).findByIdLessThanAndIsActiveTrueOrderByIdDesc(any(), any());
        }

        @Test
        @DisplayName("deve listar ativos com cursor")
        void deveListarAtivosComCursor() {
            Produto produto2 = new Produto();
            produto2.setId(5);
            produto2.setCodigo("P005");
            produto2.setDescricao("Alface");
            produto2.setUnidadeMedida(unidadeMedida);
            produto2.setEstoqueAtual(new BigDecimal("10.500"));
            produto2.setIsActive(true);
            produto2.setCreatedAt(LocalDateTime.of(2026, 3, 2, 12, 0));

            // Use limit=1 so that PageImpl(content=[1 item], page(0,1), total=2) correctly returns hasNext()=true
            Pageable pageable = PageRequest.of(0, 1);
            Page<Produto> page = new PageImpl<>(List.of(produto2), pageable, 2);

            when(produtoRepository.findByIdLessThanAndIsActiveTrueOrderByIdDesc(eq(10), eq(pageable))).thenReturn(page);
            when(unidadeMedidaService.mapToResponse(unidadeMedida)).thenReturn(unidadeMedidaResponse);

            CursorResponse<ProdutoResponse> response = produtoService.listarAtivos(10, 1);

            assertThat(response).isNotNull();
            assertThat(response.getData()).hasSize(1);
            assertThat(response.getData().getFirst().getId()).isEqualTo(5);
            assertThat(response.getNextCursor()).isEqualTo(5);
            assertThat(response.isHasNext()).isTrue();

            verify(produtoRepository).findByIdLessThanAndIsActiveTrueOrderByIdDesc(10, pageable);
            verify(produtoRepository, never()).findAllByIsActiveTrueOrderByIdDesc(any());
        }

        @Test
        @DisplayName("deve retornar resultado vazio")
        void deveRetornarResultadoVazio() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<Produto> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

            when(produtoRepository.findAllByIsActiveTrueOrderByIdDesc(pageable)).thenReturn(emptyPage);

            CursorResponse<ProdutoResponse> response = produtoService.listarAtivos(null, 10);

            assertThat(response).isNotNull();
            assertThat(response.getData()).isEmpty();
            assertThat(response.getNextCursor()).isNull();
            assertThat(response.isHasNext()).isFalse();
        }
    }

    @Nested
    @DisplayName("buscarPorId")
    class BuscarPorId {

        @Test
        @DisplayName("deve buscar produto por id com sucesso")
        void deveBuscarProdutoPorIdComSucesso() {
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            when(unidadeMedidaService.mapToResponse(unidadeMedida)).thenReturn(unidadeMedidaResponse);

            ProdutoResponse response = produtoService.buscarPorId(1);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getCodigo()).isEqualTo("P001");
            assertThat(response.getUnidadeMedida().getSigla()).isEqualTo("KG");

            verify(produtoRepository).findById(1);
        }

        @Test
        @DisplayName("deve lancar excecao quando produto nao encontrado")
        void deveLancarExcecaoQuandoProdutoNaoEncontrado() {
            when(produtoRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> produtoService.buscarPorId(99))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Produto não encontrado.");

            verify(produtoRepository).findById(99);
        }
    }

    @Nested
    @DisplayName("atualizar")
    class Atualizar {

        @Test
        @DisplayName("deve atualizar produto com sucesso")
        void deveAtualizarProdutoComSucesso() {
            ProdutoRequest updateRequest = new ProdutoRequest();
            updateRequest.setCodigo("P002");
            updateRequest.setDescricao("Cebola");
            updateRequest.setUnidadeMedidaId(1);

            Produto produtoAtualizado = new Produto();
            produtoAtualizado.setId(1);
            produtoAtualizado.setCodigo("P002");
            produtoAtualizado.setDescricao("Cebola");
            produtoAtualizado.setUnidadeMedida(unidadeMedida);
            produtoAtualizado.setEstoqueAtual(BigDecimal.ZERO);
            produtoAtualizado.setIsActive(true);
            produtoAtualizado.setCreatedAt(LocalDateTime.of(2026, 3, 1, 10, 0));

            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            when(unidadeMedidaRepository.findById(1)).thenReturn(Optional.of(unidadeMedida));
            when(produtoRepository.save(any(Produto.class))).thenReturn(produtoAtualizado);
            when(unidadeMedidaService.mapToResponse(unidadeMedida)).thenReturn(unidadeMedidaResponse);

            ProdutoResponse response = produtoService.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getCodigo()).isEqualTo("P002");
            assertThat(response.getDescricao()).isEqualTo("Cebola");
            assertThat(response.getUnidadeMedida()).isEqualTo(unidadeMedidaResponse);

            verify(produtoRepository).findById(1);
            verify(unidadeMedidaRepository).findById(1);
            verify(produtoRepository).save(any(Produto.class));
        }

        @Test
        @DisplayName("deve lancar excecao quando produto nao encontrado ao atualizar")
        void deveLancarExcecaoQuandoProdutoNaoEncontradoAoAtualizar() {
            when(produtoRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> produtoService.atualizar(99, produtoRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Produto não encontrado.");

            verify(produtoRepository).findById(99);
            verify(unidadeMedidaRepository, never()).findById(any());
            verify(produtoRepository, never()).save(any());
        }

        @Test
        @DisplayName("deve lancar excecao quando unidade de medida nao encontrada ao atualizar")
        void deveLancarExcecaoQuandoUnidadeMedidaNaoEncontradaAoAtualizar() {
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            when(unidadeMedidaRepository.findById(1)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> produtoService.atualizar(1, produtoRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Unidade de Medida inválida.");

            verify(produtoRepository).findById(1);
            verify(unidadeMedidaRepository).findById(1);
            verify(produtoRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("deletar")
    class Deletar {

        @Test
        @DisplayName("deve realizar soft delete com sucesso")
        void deveRealizarSoftDeleteComSucesso() {
            when(produtoRepository.findById(1)).thenReturn(Optional.of(produto));
            when(produtoRepository.save(any(Produto.class))).thenReturn(produto);

            produtoService.deletar(1);

            assertThat(produto.getIsActive()).isFalse();

            verify(produtoRepository).findById(1);
            verify(produtoRepository).save(produto);
        }

        @Test
        @DisplayName("deve lancar excecao quando produto nao encontrado ao deletar")
        void deveLancarExcecaoQuandoProdutoNaoEncontradoAoDeletar() {
            when(produtoRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> produtoService.deletar(99))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Não encontrado.");

            verify(produtoRepository).findById(99);
            verify(produtoRepository, never()).save(any());
        }
    }
}
