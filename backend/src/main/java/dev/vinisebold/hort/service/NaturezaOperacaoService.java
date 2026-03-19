package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.NaturezaOperacaoRequest;
import dev.vinisebold.hort.dto.response.NaturezaOperacaoResponse;
import dev.vinisebold.hort.model.CampoPropriedade;
import dev.vinisebold.hort.model.NaturezaOperacao;
import dev.vinisebold.hort.repository.NaturezaOperacaoRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
    no.setPropriedadeCliente(request.getPropriedadeCliente());
    no.setPropriedadeValorUnitario(request.getPropriedadeValorUnitario());
    no.setPropriedadeStatus(request.getPropriedadeStatus());
    syncLegacyFlags(no);
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
    if (!no.getDescricao().equals(request.getDescricao())
        && repository.existsByDescricao(request.getDescricao())) {
      throw new IllegalArgumentException("Já existe uma Natureza de Operação com esta descrição.");
    }
    no.setDescricao(request.getDescricao());
    no.setTipoMovimento(request.getTipoMovimento());
    no.setPropriedadeCliente(request.getPropriedadeCliente());
    no.setPropriedadeValorUnitario(request.getPropriedadeValorUnitario());
    no.setPropriedadeStatus(request.getPropriedadeStatus());
    syncLegacyFlags(no);
    return mapToResponse(repository.save(no));
  }

  public NaturezaOperacaoResponse mapToResponse(NaturezaOperacao no) {
    CampoPropriedade propriedadeCliente = resolvePropriedade(no.getPropriedadeCliente(),
        no.getExigeCliente());
    CampoPropriedade propriedadeValorUnitario = resolvePropriedade(no.getPropriedadeValorUnitario(),
        no.getExigeValorUnitario());
    CampoPropriedade propriedadeStatus = resolvePropriedade(no.getPropriedadeStatus(),
        no.getExigeStatus());

    return NaturezaOperacaoResponse.builder()
        .id(no.getId()).descricao(no.getDescricao())
        .tipoMovimento(no.getTipoMovimento())
        .propriedadeCliente(propriedadeCliente)
        .propriedadeValorUnitario(propriedadeValorUnitario)
        .propriedadeStatus(propriedadeStatus)
        .build();
  }

  private void syncLegacyFlags(NaturezaOperacao no) {
    CampoPropriedade propriedadeCliente = resolvePropriedade(no.getPropriedadeCliente(),
        no.getExigeCliente());
    CampoPropriedade propriedadeValorUnitario = resolvePropriedade(no.getPropriedadeValorUnitario(),
        no.getExigeValorUnitario());
    CampoPropriedade propriedadeStatus = resolvePropriedade(no.getPropriedadeStatus(),
        no.getExigeStatus());

    no.setPropriedadeCliente(propriedadeCliente);
    no.setPropriedadeValorUnitario(propriedadeValorUnitario);
    no.setPropriedadeStatus(propriedadeStatus);
    no.setExigeCliente(CampoPropriedade.OBRIGATORIO.equals(propriedadeCliente));
    no.setExigeValorUnitario(CampoPropriedade.OBRIGATORIO.equals(propriedadeValorUnitario));
    no.setExigeStatus(CampoPropriedade.OBRIGATORIO.equals(propriedadeStatus));
  }

  private CampoPropriedade resolvePropriedade(CampoPropriedade propriedade, Boolean legadoExige) {
    if (propriedade != null) {
      return propriedade;
    }
    return Boolean.TRUE.equals(legadoExige) ? CampoPropriedade.OBRIGATORIO
        : CampoPropriedade.DESATIVADO;
  }
}
