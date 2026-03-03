package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.dto.response.CursorResponse;
import dev.vinisebold.hort.model.Cliente;
import dev.vinisebold.hort.repository.ClienteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
class ClienteServiceTest {

    @Mock
    private ClienteRepository clienteRepository;

    @InjectMocks
    private ClienteService clienteService;

    private ClienteRequest defaultRequest;
    private Cliente defaultCliente;

    @BeforeEach
    void setUp() {
        defaultRequest = new ClienteRequest();
        defaultRequest.setTipoPessoa("Jurídica");
        defaultRequest.setDocumento("12345678000199");
        defaultRequest.setRazaoSocial("Empresa Teste LTDA");
        defaultRequest.setNomeFantasia("Teste");
        defaultRequest.setEndereco("Rua Exemplo, 123");
        defaultRequest.setTelefone("11999999999");

        defaultCliente = new Cliente();
        defaultCliente.setId(1);
        defaultCliente.setTipoPessoa("Jurídica");
        defaultCliente.setDocumento("12345678000199");
        defaultCliente.setRazaoSocial("Empresa Teste LTDA");
        defaultCliente.setNomeFantasia("Teste");
        defaultCliente.setEndereco("Rua Exemplo, 123");
        defaultCliente.setTelefone("11999999999");
        defaultCliente.setIsActive(true);
        defaultCliente.setCreatedAt(LocalDateTime.of(2026, 1, 15, 10, 30, 0));
    }

    // ========================================================================
    // criar
    // ========================================================================

    @Nested
    @DisplayName("criar")
    class Criar {

        @Test
        @DisplayName("Deve criar cliente com sucesso quando documento nao existe")
        void deveCriarClienteComSucesso() {
            when(clienteRepository.existsByDocumento("12345678000199")).thenReturn(false);
            when(clienteRepository.save(any(Cliente.class))).thenReturn(defaultCliente);

            ClienteResponse response = clienteService.criar(defaultRequest);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getTipoPessoa()).isEqualTo("Jurídica");
            assertThat(response.getDocumento()).isEqualTo("12345678000199");
            assertThat(response.getRazaoSocial()).isEqualTo("Empresa Teste LTDA");
            assertThat(response.getNomeFantasia()).isEqualTo("Teste");
            assertThat(response.getEndereco()).isEqualTo("Rua Exemplo, 123");
            assertThat(response.getTelefone()).isEqualTo("11999999999");
            assertThat(response.getIsActive()).isTrue();
            assertThat(response.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 1, 15, 10, 30, 0));

            ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
            verify(clienteRepository).save(captor.capture());
            Cliente saved = captor.getValue();
            assertThat(saved.getTipoPessoa()).isEqualTo("Jurídica");
            assertThat(saved.getDocumento()).isEqualTo("12345678000199");
            assertThat(saved.getRazaoSocial()).isEqualTo("Empresa Teste LTDA");
        }

        @Test
        @DisplayName("Deve lancar excecao quando documento ja existe")
        void deveLancarExcecaoQuandoDocumentoJaExiste() {
            when(clienteRepository.existsByDocumento("12345678000199")).thenReturn(true);

            assertThatThrownBy(() -> clienteService.criar(defaultRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe um cliente com este documento.");

            verify(clienteRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve permitir criar cliente com documento nulo sem verificar duplicidade")
        void devePermitirDocumentoNulo() {
            defaultRequest.setDocumento(null);

            Cliente clienteSemDoc = new Cliente();
            clienteSemDoc.setId(2);
            clienteSemDoc.setTipoPessoa("Física");
            clienteSemDoc.setDocumento(null);
            clienteSemDoc.setRazaoSocial("Empresa Teste LTDA");
            clienteSemDoc.setNomeFantasia("Teste");
            clienteSemDoc.setEndereco("Rua Exemplo, 123");
            clienteSemDoc.setTelefone("11999999999");
            clienteSemDoc.setIsActive(true);
            clienteSemDoc.setCreatedAt(LocalDateTime.of(2026, 1, 15, 10, 30, 0));

            when(clienteRepository.save(any(Cliente.class))).thenReturn(clienteSemDoc);

            ClienteResponse response = clienteService.criar(defaultRequest);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(2);
            assertThat(response.getDocumento()).isNull();

            verify(clienteRepository, never()).existsByDocumento(any());
            verify(clienteRepository).save(any(Cliente.class));
        }
    }

    // ========================================================================
    // listarAtivos
    // ========================================================================

    @Nested
    @DisplayName("listarAtivos")
    class ListarAtivos {

        @Test
        @DisplayName("Deve listar clientes ativos sem cursor (primeira pagina)")
        void deveListarSemCursor() {
            Cliente cliente2 = new Cliente();
            cliente2.setId(2);
            cliente2.setTipoPessoa("Física");
            cliente2.setDocumento("98765432100");
            cliente2.setRazaoSocial("Pessoa Teste");
            cliente2.setNomeFantasia(null);
            cliente2.setEndereco("Av. Brasil, 456");
            cliente2.setTelefone("21988888888");
            cliente2.setIsActive(true);
            cliente2.setCreatedAt(LocalDateTime.of(2026, 2, 1, 8, 0, 0));

            List<Cliente> clientes = List.of(defaultCliente, cliente2);
            Page<Cliente> page = new PageImpl<>(clientes, PageRequest.of(0, 10), 15);

            when(clienteRepository.findAllByIsActiveTrueOrderByIdDesc(any(Pageable.class))).thenReturn(page);

            CursorResponse<ClienteResponse> result = clienteService.listarAtivos(null, 10);

            assertThat(result).isNotNull();
            assertThat(result.getData()).hasSize(2);
            assertThat(result.getData().getFirst().getId()).isEqualTo(1);
            assertThat(result.getData().getLast().getId()).isEqualTo(2);
            assertThat(result.getNextCursor()).isEqualTo(2);
            assertThat(result.isHasNext()).isTrue();

            verify(clienteRepository).findAllByIsActiveTrueOrderByIdDesc(any(Pageable.class));
            verify(clienteRepository, never()).findByIdLessThanAndIsActiveTrueOrderByIdDesc(any(), any());
        }

        @Test
        @DisplayName("Deve listar clientes ativos com cursor (paginacao)")
        void deveListarComCursor() {
            Cliente cliente3 = new Cliente();
            cliente3.setId(3);
            cliente3.setTipoPessoa("Jurídica");
            cliente3.setDocumento("11222333000144");
            cliente3.setRazaoSocial("Outra Empresa");
            cliente3.setNomeFantasia("Outra");
            cliente3.setEndereco("Rua Nova, 789");
            cliente3.setTelefone("31977777777");
            cliente3.setIsActive(true);
            cliente3.setCreatedAt(LocalDateTime.of(2026, 3, 1, 14, 0, 0));

            Page<Cliente> page = new PageImpl<>(List.of(cliente3), PageRequest.of(0, 5), 5);

            when(clienteRepository.findByIdLessThanAndIsActiveTrueOrderByIdDesc(eq(10), any(Pageable.class)))
                    .thenReturn(page);

            CursorResponse<ClienteResponse> result = clienteService.listarAtivos(10, 5);

            assertThat(result).isNotNull();
            assertThat(result.getData()).hasSize(1);
            assertThat(result.getData().getFirst().getId()).isEqualTo(3);
            assertThat(result.getData().getFirst().getRazaoSocial()).isEqualTo("Outra Empresa");
            assertThat(result.getNextCursor()).isEqualTo(3);
            assertThat(result.isHasNext()).isFalse();

            verify(clienteRepository).findByIdLessThanAndIsActiveTrueOrderByIdDesc(eq(10), any(Pageable.class));
            verify(clienteRepository, never()).findAllByIsActiveTrueOrderByIdDesc(any());
        }

        @Test
        @DisplayName("Deve retornar lista vazia quando nao ha clientes ativos")
        void deveRetornarListaVazia() {
            Page<Cliente> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);

            when(clienteRepository.findAllByIsActiveTrueOrderByIdDesc(any(Pageable.class))).thenReturn(emptyPage);

            CursorResponse<ClienteResponse> result = clienteService.listarAtivos(null, 10);

            assertThat(result).isNotNull();
            assertThat(result.getData()).isEmpty();
            assertThat(result.getNextCursor()).isNull();
            assertThat(result.isHasNext()).isFalse();
        }
    }

    // ========================================================================
    // buscarPorId
    // ========================================================================

    @Nested
    @DisplayName("buscarPorId")
    class BuscarPorId {

        @Test
        @DisplayName("Deve retornar cliente quando encontrado pelo id")
        void deveRetornarClienteQuandoEncontrado() {
            when(clienteRepository.findById(1)).thenReturn(Optional.of(defaultCliente));

            ClienteResponse response = clienteService.buscarPorId(1);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getTipoPessoa()).isEqualTo("Jurídica");
            assertThat(response.getDocumento()).isEqualTo("12345678000199");
            assertThat(response.getRazaoSocial()).isEqualTo("Empresa Teste LTDA");
            assertThat(response.getNomeFantasia()).isEqualTo("Teste");
            assertThat(response.getEndereco()).isEqualTo("Rua Exemplo, 123");
            assertThat(response.getTelefone()).isEqualTo("11999999999");
            assertThat(response.getIsActive()).isTrue();
            assertThat(response.getCreatedAt()).isEqualTo(LocalDateTime.of(2026, 1, 15, 10, 30, 0));

            verify(clienteRepository).findById(1);
        }

        @Test
        @DisplayName("Deve lancar excecao quando cliente nao encontrado")
        void deveLancarExcecaoQuandoNaoEncontrado() {
            when(clienteRepository.findById(999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clienteService.buscarPorId(999))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Cliente não encontrado.");

            verify(clienteRepository).findById(999);
        }
    }

    // ========================================================================
    // atualizar
    // ========================================================================

    @Nested
    @DisplayName("atualizar")
    class Atualizar {

        @Test
        @DisplayName("Deve atualizar cliente com sucesso")
        void deveAtualizarComSucesso() {
            ClienteRequest updateRequest = new ClienteRequest();
            updateRequest.setTipoPessoa("Jurídica");
            updateRequest.setDocumento("99988877000166");
            updateRequest.setRazaoSocial("Empresa Atualizada LTDA");
            updateRequest.setNomeFantasia("Atualizada");
            updateRequest.setEndereco("Rua Atualizada, 999");
            updateRequest.setTelefone("11911111111");

            Cliente updatedCliente = new Cliente();
            updatedCliente.setId(1);
            updatedCliente.setTipoPessoa("Jurídica");
            updatedCliente.setDocumento("99988877000166");
            updatedCliente.setRazaoSocial("Empresa Atualizada LTDA");
            updatedCliente.setNomeFantasia("Atualizada");
            updatedCliente.setEndereco("Rua Atualizada, 999");
            updatedCliente.setTelefone("11911111111");
            updatedCliente.setIsActive(true);
            updatedCliente.setCreatedAt(LocalDateTime.of(2026, 1, 15, 10, 30, 0));

            when(clienteRepository.findById(1)).thenReturn(Optional.of(defaultCliente));
            when(clienteRepository.existsByDocumento("99988877000166")).thenReturn(false);
            when(clienteRepository.save(any(Cliente.class))).thenReturn(updatedCliente);

            ClienteResponse response = clienteService.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1);
            assertThat(response.getDocumento()).isEqualTo("99988877000166");
            assertThat(response.getRazaoSocial()).isEqualTo("Empresa Atualizada LTDA");
            assertThat(response.getNomeFantasia()).isEqualTo("Atualizada");
            assertThat(response.getEndereco()).isEqualTo("Rua Atualizada, 999");
            assertThat(response.getTelefone()).isEqualTo("11911111111");

            verify(clienteRepository).findById(1);
            verify(clienteRepository).existsByDocumento("99988877000166");
            verify(clienteRepository).save(any(Cliente.class));
        }

        @Test
        @DisplayName("Deve lancar excecao quando documento duplicado em atualizacao")
        void deveLancarExcecaoQuandoDocumentoDuplicado() {
            ClienteRequest updateRequest = new ClienteRequest();
            updateRequest.setTipoPessoa("Jurídica");
            updateRequest.setDocumento("55566677000188");
            updateRequest.setRazaoSocial("Outra Empresa");
            updateRequest.setNomeFantasia(null);
            updateRequest.setEndereco(null);
            updateRequest.setTelefone(null);

            when(clienteRepository.findById(1)).thenReturn(Optional.of(defaultCliente));
            when(clienteRepository.existsByDocumento("55566677000188")).thenReturn(true);

            assertThatThrownBy(() -> clienteService.atualizar(1, updateRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Já existe outro cliente com este documento.");

            verify(clienteRepository).findById(1);
            verify(clienteRepository).existsByDocumento("55566677000188");
            verify(clienteRepository, never()).save(any());
        }

        @Test
        @DisplayName("Deve permitir atualizar mantendo o mesmo documento sem erro de duplicidade")
        void devePermitirMesmoDocumento() {
            ClienteRequest updateRequest = new ClienteRequest();
            updateRequest.setTipoPessoa("Jurídica");
            updateRequest.setDocumento("12345678000199"); // mesmo documento do defaultCliente
            updateRequest.setRazaoSocial("Empresa Teste Renomeada");
            updateRequest.setNomeFantasia("Teste Renomeado");
            updateRequest.setEndereco("Rua Exemplo, 123");
            updateRequest.setTelefone("11999999999");

            Cliente savedCliente = new Cliente();
            savedCliente.setId(1);
            savedCliente.setTipoPessoa("Jurídica");
            savedCliente.setDocumento("12345678000199");
            savedCliente.setRazaoSocial("Empresa Teste Renomeada");
            savedCliente.setNomeFantasia("Teste Renomeado");
            savedCliente.setEndereco("Rua Exemplo, 123");
            savedCliente.setTelefone("11999999999");
            savedCliente.setIsActive(true);
            savedCliente.setCreatedAt(LocalDateTime.of(2026, 1, 15, 10, 30, 0));

            when(clienteRepository.findById(1)).thenReturn(Optional.of(defaultCliente));
            when(clienteRepository.save(any(Cliente.class))).thenReturn(savedCliente);

            ClienteResponse response = clienteService.atualizar(1, updateRequest);

            assertThat(response).isNotNull();
            assertThat(response.getRazaoSocial()).isEqualTo("Empresa Teste Renomeada");
            assertThat(response.getDocumento()).isEqualTo("12345678000199");

            // existsByDocumento should NOT be called because document hasn't changed
            verify(clienteRepository, never()).existsByDocumento(any());
            verify(clienteRepository).save(any(Cliente.class));
        }

        @Test
        @DisplayName("Deve lancar excecao quando cliente nao encontrado na atualizacao")
        void deveLancarExcecaoQuandoClienteNaoEncontrado() {
            when(clienteRepository.findById(999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clienteService.atualizar(999, defaultRequest))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Cliente não encontrado.");

            verify(clienteRepository).findById(999);
            verify(clienteRepository, never()).existsByDocumento(any());
            verify(clienteRepository, never()).save(any());
        }
    }

    // ========================================================================
    // deletar
    // ========================================================================

    @Nested
    @DisplayName("deletar")
    class Deletar {

        @Test
        @DisplayName("Deve realizar soft delete do cliente com sucesso")
        void deveRealizarSoftDelete() {
            when(clienteRepository.findById(1)).thenReturn(Optional.of(defaultCliente));
            when(clienteRepository.save(any(Cliente.class))).thenReturn(defaultCliente);

            clienteService.deletar(1);

            ArgumentCaptor<Cliente> captor = ArgumentCaptor.forClass(Cliente.class);
            verify(clienteRepository).save(captor.capture());
            Cliente saved = captor.getValue();
            assertThat(saved.getIsActive()).isFalse();

            verify(clienteRepository).findById(1);
        }

        @Test
        @DisplayName("Deve lancar excecao quando cliente nao encontrado na exclusao")
        void deveLancarExcecaoQuandoClienteNaoEncontrado() {
            when(clienteRepository.findById(999)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> clienteService.deletar(999))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Cliente não encontrado.");

            verify(clienteRepository).findById(999);
            verify(clienteRepository, never()).save(any());
        }
    }
}
