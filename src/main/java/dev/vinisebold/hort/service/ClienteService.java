package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.model.Cliente;
import dev.vinisebold.hort.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        if (request.getDocumento() != null && clienteRepository.existsByDocumento(request.getDocumento())) {
            throw new IllegalArgumentException("Já existe um cliente com este documento.");
        }

        Cliente cliente = new Cliente();
        atualizarDados(cliente, request);

        cliente = clienteRepository.save(cliente);
        return mapToResponse(cliente);
    }

    public List<ClienteResponse> listarAtivos() {
        return clienteRepository.findAllByIsActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ClienteResponse buscarPorId(Integer id) {
        Cliente cliente = getClienteEntity(id);
        return mapToResponse(cliente);
    }

    @Transactional
    public ClienteResponse atualizar(Integer id, ClienteRequest request) {
        Cliente cliente = getClienteEntity(id);

        // Se mudou o documento, verifica se o novo já existe
        if (request.getDocumento() != null &&
                !request.getDocumento().equals(cliente.getDocumento()) &&
                clienteRepository.existsByDocumento(request.getDocumento())) {
            throw new IllegalArgumentException("Já existe outro cliente com este documento.");
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

    // --- Métodos Auxiliares Privados (Clean Code) ---

    private Cliente getClienteEntity(Integer id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
    }

    private void atualizarDados(Cliente cliente, ClienteRequest request) {
        cliente.setTipoPessoa(request.getTipoPessoa());
        cliente.setDocumento(request.getDocumento());
        cliente.setRazaoSocial(request.getRazaoSocial());
        cliente.setNomeFantasia(request.getNomeFantasia());
        cliente.setEndereco(request.getEndereco());
        cliente.setTelefone(request.getTelefone());
    }

    private ClienteResponse mapToResponse(Cliente cliente) {
        return ClienteResponse.builder()
                .id(cliente.getId())
                .tipoPessoa(cliente.getTipoPessoa())
                .documento(cliente.getDocumento())
                .razaoSocial(cliente.getRazaoSocial())
                .nomeFantasia(cliente.getNomeFantasia())
                .endereco(cliente.getEndereco())
                .telefone(cliente.getTelefone())
                .isActive(cliente.getIsActive())
                .createdAt(cliente.getCreatedAt())
                .build();
    }
}