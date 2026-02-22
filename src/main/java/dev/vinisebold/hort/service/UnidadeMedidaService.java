package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.UnidadeMedidaRequest;
import dev.vinisebold.hort.dto.response.UnidadeMedidaResponse;
import dev.vinisebold.hort.model.UnidadeMedida;
import dev.vinisebold.hort.repository.UnidadeMedidaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UnidadeMedidaService {

    private final UnidadeMedidaRepository repository;

    @Transactional
    public UnidadeMedidaResponse criar(UnidadeMedidaRequest request) {
        if (repository.existsBySigla(request.getSigla())) {
            throw new IllegalArgumentException("Já existe uma Unidade de Medida com esta sigla.");
        }
        UnidadeMedida um = new UnidadeMedida();
        um.setSigla(request.getSigla());
        um.setDescricao(request.getDescricao());
        return mapToResponse(repository.save(um));
    }

    public List<UnidadeMedidaResponse> listarAtivos() {
        return repository.findAllByIsActiveTrue().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deletar(Integer id) {
        UnidadeMedida um = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Não encontrado."));
        um.setIsActive(false);
        repository.save(um);
    }

    public UnidadeMedidaResponse mapToResponse(UnidadeMedida um) {
        return UnidadeMedidaResponse.builder()
                .id(um.getId()).sigla(um.getSigla()).descricao(um.getDescricao()).isActive(um.getIsActive()).build();
    }
}