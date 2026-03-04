package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.model.Cliente;
import dev.vinisebold.hort.repository.ClienteRepository;
import dev.vinisebold.hort.util.ClienteFormatter;
import dev.vinisebold.hort.validator.CpfValidator;
import dev.vinisebold.hort.validator.CnpjValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import dev.vinisebold.hort.dto.response.CursorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        validarClienteRequest(request);

        if (request.getDocumento() != null) {
            String documentoLimpo = ClienteFormatter.removeCpfFormatting(request.getDocumento());
            if (clienteRepository.existsByDocumento(documentoLimpo)) {
                throw new IllegalArgumentException("Já existe um cliente com este documento.");
            }
        }

        Cliente cliente = new Cliente();
        atualizarDados(cliente, request);

        cliente = clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    public CursorResponse<ClienteResponse> listarAtivos(Integer cursor, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<Cliente> page;

        if (cursor != null) {
            page = clienteRepository.findByIdLessThanAndIsActiveTrueOrderByIdDesc(cursor, pageable);
        } else {
            page = clienteRepository.findAllByIsActiveTrueOrderByIdDesc(pageable);
        }

        List<ClienteResponse> data = page.getContent()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        Integer nextCursor = data.isEmpty() ? null : data.getLast().getId();

        return CursorResponse.<ClienteResponse>builder()
                .data(data)
                .nextCursor(nextCursor)
                .hasNext(page.hasNext())
                .build();
    }

    public ClienteResponse buscarPorId(Integer id) {
        Cliente cliente = getClienteEntity(id);
        return mapToResponse(cliente);
    }

    @Transactional
    public ClienteResponse atualizar(Integer id, ClienteRequest request) {
        Cliente cliente = getClienteEntity(id);
        validarClienteRequest(request);

        // Se mudou o documento, verifica se o novo já existe
        if (request.getDocumento() != null) {
            String documentoLimpo = ClienteFormatter.removeCpfFormatting(request.getDocumento());
            String documentoAntigo = cliente.getDocumento();
            if (!documentoLimpo.equals(documentoAntigo) &&
                    clienteRepository.existsByDocumento(documentoLimpo)) {
                throw new IllegalArgumentException("Já existe outro cliente com este documento.");
            }
        }

        atualizarDados(cliente, request);
        cliente = clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    @Transactional
    public void deletar(Integer id) {
        Cliente cliente = getClienteEntity(id);
        cliente.setIsActive(false); // RN01: Soft Delete aplicado
        clienteRepository.save(cliente);
    }

    /**
     * Busca ou cria um cliente do tipo Pessoa Física
     * @param nome Nome do cliente a buscar ou criar
     * @return Cliente encontrado ou recém-criado
     */
    @Transactional
    public ClienteResponse buscarOuCriarClientePF(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do cliente não pode estar vazio.");
        }

        // Busca cliente PF com o mesmo nome (case-insensitive)
        var clienteExistente = clienteRepository
                .findByRazaoSocialIgnoreCaseAndTipoPessoaAndIsActiveTrueIgnoreCase(
                        nome.trim(), "FISICA");

        if (clienteExistente.isPresent()) {
            return mapToResponse(clienteExistente.get());
        }

        // Se não encontrar, cria novo cliente PF
        ClienteRequest novoClienteRequest = new ClienteRequest();
        novoClienteRequest.setTipoPessoa("FISICA");
        novoClienteRequest.setRazaoSocial(nome.trim());

        return criar(novoClienteRequest);
    }

    // --- Métodos Auxiliares Privados (Clean Code) ---

    private Cliente getClienteEntity(Integer id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
    }

    /**
     * Valida o request conforme o tipo de cliente
     */
    private void validarClienteRequest(ClienteRequest request) {
        if (request == null || request.getTipoPessoa() == null) {
            throw new IllegalArgumentException("Tipo de pessoa é obrigatório.");
        }

        String tipoPessoa = request.getTipoPessoa();

        if ("FISICA".equalsIgnoreCase(tipoPessoa)) {
            validarClientePF(request);
        } else if ("JURIDICA".equalsIgnoreCase(tipoPessoa)) {
            validarClientePJ(request);
        } else {
            throw new IllegalArgumentException("Tipo de pessoa inválido. Use 'FISICA' ou 'JURIDICA'.");
        }
    }

    /**
     * Valida campos específicos de Pessoa Física
     */
    private void validarClientePF(ClienteRequest request) {
        // Nome é obrigatório
        if (request.getRazaoSocial() == null || request.getRazaoSocial().trim().isEmpty()) {
            throw new IllegalArgumentException("Nome é obrigatório para cliente Pessoa Física.");
        }

        // CPF é opcional, mas se preenchido deve ser válido
        if (request.getDocumento() != null && !request.getDocumento().trim().isEmpty()) {
            String cpfLimpo = ClienteFormatter.removeCpfFormatting(request.getDocumento());
            if (!CpfValidator.isValid(cpfLimpo)) {
                throw new IllegalArgumentException("CPF inválido.");
            }
        }

        // Verifica duplicação de nome para PF
        if (clienteRepository
                .findByRazaoSocialIgnoreCaseAndTipoPessoaAndIsActiveTrueIgnoreCase(
                        request.getRazaoSocial().trim(), "FISICA")
                .isPresent()) {
            throw new IllegalArgumentException("Já existe um cliente Pessoa Física com este nome.");
        }
    }

    /**
     * Valida campos específicos de Pessoa Jurídica
     */
    private void validarClientePJ(ClienteRequest request) {
        // Razão Social é obrigatória
        if (request.getRazaoSocial() == null || request.getRazaoSocial().trim().isEmpty()) {
            throw new IllegalArgumentException("Razão Social é obrigatória para cliente Pessoa Jurídica.");
        }

        // CNPJ é obrigatório
        if (request.getDocumento() == null || request.getDocumento().trim().isEmpty()) {
            throw new IllegalArgumentException("CNPJ é obrigatório para cliente Pessoa Jurídica.");
        }

        // Valida CNPJ
        String cnpjLimpo = ClienteFormatter.removeCnpjFormatting(request.getDocumento());
        if (!CnpjValidator.isValid(cnpjLimpo)) {
            throw new IllegalArgumentException("CNPJ inválido.");
        }
    }

    private void atualizarDados(Cliente cliente, ClienteRequest request) {
        cliente.setTipoPessoa(request.getTipoPessoa());

        // Formata documento se for PF (CPF)
        if ("FISICA".equalsIgnoreCase(request.getTipoPessoa()) && request.getDocumento() != null) {
            String cpfFormatado = ClienteFormatter.formatCpf(request.getDocumento());
            cliente.setDocumento(cpfFormatado);
        } else {
            // Para PJ, apenas remove formatação e armazena limpo
            String documento = request.getDocumento();
            if (documento != null) {
                documento = ClienteFormatter.removeCnpjFormatting(documento);
            }
            cliente.setDocumento(documento);
        }

        cliente.setRazaoSocial(request.getRazaoSocial());
        cliente.setNomeFantasia(request.getNomeFantasia());
        cliente.setEndereco(request.getEndereco());
        cliente.setContato(request.getContato());
    }

    private ClienteResponse mapToResponse(Cliente cliente) {
        return ClienteResponse.builder()
                .id(cliente.getId())
                .tipoPessoa(cliente.getTipoPessoa())
                .documento(cliente.getDocumento())
                .razaoSocial(cliente.getRazaoSocial())
                .nomeFantasia(cliente.getNomeFantasia())
                .endereco(cliente.getEndereco())
                .contato(cliente.getContato())
                .isActive(cliente.getIsActive())
                .createdAt(cliente.getCreatedAt())
                .build();
    }
}
