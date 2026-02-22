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
        no.setGeraFinanceiro(request.getGeraFinanceiro());
        return mapToResponse(repository.save(no));
    }

    public List<NaturezaOperacaoResponse> listarTodos() {
        return repository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public NaturezaOperacaoResponse mapToResponse(NaturezaOperacao no) {
        return NaturezaOperacaoResponse.builder()
                .id(no.getId()).descricao(no.getDescricao())
                .tipoMovimento(no.getTipoMovimento()).geraFinanceiro(no.getGeraFinanceiro()).build();
    }
}