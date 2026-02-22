package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.FormaPagamentoRequest;
import dev.vinisebold.hort.dto.response.FormaPagamentoResponse;
import dev.vinisebold.hort.model.FormaPagamento;
import dev.vinisebold.hort.repository.FormaPagamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FormaPagamentoService {

    private final FormaPagamentoRepository repository;

    public FormaPagamentoResponse criar(FormaPagamentoRequest request) {
        if (repository.existsByDescricao(request.getDescricao())) {
            throw new IllegalArgumentException("Já existe uma Forma de Pagamento com esta descrição.");
        }
        FormaPagamento fp = new FormaPagamento();
        fp.setDescricao(request.getDescricao());
        fp.setExigeCliente(request.getExigeCliente());
        fp.setExigeDocumentoReferencia(request.getExigeDocumentoReferencia());
        return mapToResponse(repository.save(fp));
    }

    public List<FormaPagamentoResponse> listarAtivos() {
        return repository.findAllByIsActiveTrue().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public void deletar(Integer id) {
        FormaPagamento fp = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Não encontrado."));
        fp.setIsActive(false); // Soft delete
        repository.save(fp);
    }

    public FormaPagamentoResponse mapToResponse(FormaPagamento fp) {
        return FormaPagamentoResponse.builder()
                .id(fp.getId()).descricao(fp.getDescricao()).exigeCliente(fp.getExigeCliente())
                .exigeDocumentoReferencia(fp.getExigeDocumentoReferencia()).isActive(fp.getIsActive()).build();
    }
}