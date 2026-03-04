package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.NaturezaOperacaoRequest;
import dev.vinisebold.hort.dto.response.NaturezaOperacaoResponse;
import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.repository.NaturezaOperacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NaturezaOperacaoService {

    private final NaturezaOperacaoRepository repository;

    public NaturezaOperacaoResponse criar(NaturezaOperacaoRequest request) {
        if (repository.existsByDescricao(request.getDescricao())) {
            throw new IllegalArgumentException("Já existe uma Natureza de Operação com esta descrição.");
        }
        NaturezaOperacao no = new NaturezaOperacao();
        no.setDescricao(request.getDescricao());
        no.setTipoMovimento(request.getTipoMovimento());
        no.setExigeCliente(request.getExigeCliente());
        no.setExigeValorUnitario(request.getExigeValorUnitario());
        no.setExigeStatus(request.getExigeStatus());
        return mapToResponse(repository.save(no));
    }

    public List<NaturezaOperacaoResponse> listarTodos() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public NaturezaOperacaoResponse buscarPorId(Integer id) {
        NaturezaOperacao no = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Natureza de Operação não encontrada."));
        return mapToResponse(no);
    }

    public NaturezaOperacaoResponse atualizar(Integer id, NaturezaOperacaoRequest request) {
        NaturezaOperacao no = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Natureza de Operação não encontrada."));
        if (!no.getDescricao().equals(request.getDescricao()) && repository.existsByDescricao(request.getDescricao())) {
            throw new IllegalArgumentException("Já existe uma Natureza de Operação com esta descrição.");
        }
        no.setDescricao(request.getDescricao());
        no.setTipoMovimento(request.getTipoMovimento());
        no.setExigeCliente(request.getExigeCliente());
        no.setExigeValorUnitario(request.getExigeValorUnitario());
        no.setExigeStatus(request.getExigeStatus());
        return mapToResponse(repository.save(no));
    }

    public NaturezaOperacaoResponse mapToResponse(NaturezaOperacao no) {
        return NaturezaOperacaoResponse.builder()
                .id(no.getId()).descricao(no.getDescricao())
                .tipoMovimento(no.getTipoMovimento())
                .exigeCliente(no.getExigeCliente())
                .exigeValorUnitario(no.getExigeValorUnitario())
                .exigeStatus(no.getExigeStatus())
                .build();
    }
}