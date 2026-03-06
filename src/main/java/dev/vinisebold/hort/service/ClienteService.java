package dev.vinisebold.hort.service;

import dev.vinisebold.hort.dto.request.ClienteRequest;
import dev.vinisebold.hort.dto.request.AbaterDividaRequest;
import dev.vinisebold.hort.dto.response.ClienteResponse;
import dev.vinisebold.hort.dto.response.ClienteFinanceiroResponse;
import dev.vinisebold.hort.dto.response.AbaterDividaResponse;
import dev.vinisebold.hort.dto.response.PedidoResponse;
import dev.vinisebold.hort.dto.response.ItemPedidoResponse;
import dev.vinisebold.hort.model.Cliente;
import dev.vinisebold.hort.model.Pedido;
import dev.vinisebold.hort.model.ItemPedido;
import dev.vinisebold.hort.repository.ClienteRepository;
import dev.vinisebold.hort.repository.PedidoRepository;
import dev.vinisebold.hort.repository.ItemPedidoRepository;
import dev.vinisebold.hort.util.ClienteFormatter;
import dev.vinisebold.hort.validator.CpfValidator;
import dev.vinisebold.hort.validator.CnpjValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.math.BigDecimal;
import java.time.YearMonth;
import dev.vinisebold.hort.dto.response.CursorResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PedidoRepository pedidoRepository;
    private final ItemPedidoRepository itemPedidoRepository;

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        validarClienteRequest(request, null);

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
        validarClienteRequest(request, id);

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
                .findByRazaoSocialIgnoreCaseAndTipoPessoaAndIsActiveTrue(
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

    /**
     * Obtém o resumo financeiro de um cliente
     * @param clienteId ID do cliente
     * @return ClienteFinanceiroResponse com dados financeiros
     */
    @Transactional(readOnly = true)
    public ClienteFinanceiroResponse getResumoFinanceiro(Integer clienteId) {
        Cliente cliente = getClienteEntity(clienteId);
        
        // Buscar todos pedidos do cliente ordenados cronologicamente
        List<Pedido> pedidos = pedidoRepository.findByClienteIdOrderByDataEmissaoAsc(clienteId);
        
        // Calcular métricas financeiras
        YearMonth mesAtual = YearMonth.now();
        YearMonth mesAnterior = mesAtual.minusMonths(1);
        
        BigDecimal dividaTotal = BigDecimal.ZERO;
        BigDecimal dividaMesAtual = BigDecimal.ZERO;
        BigDecimal dividaMesAnterior = BigDecimal.ZERO;
        Integer totalPedidosPendentes = 0;
        Integer totalPedidosPagos = 0;
        
        List<PedidoResponse> pedidosResponse = new ArrayList<>();
        
        for (Pedido pedido : pedidos) {
            PedidoResponse pedidoResp = mapPedidoToResponse(pedido);
            pedidosResponse.add(pedidoResp);
            
            if ("PENDENTE".equalsIgnoreCase(pedido.getStatus())) {
                totalPedidosPendentes++;
                dividaTotal = dividaTotal.add(pedido.getValorTotal());
                
                // Verificar se é do mês atual ou anterior
                YearMonth mesEmissao = YearMonth.from(pedido.getDataEmissao());
                if (mesEmissao.equals(mesAtual)) {
                    dividaMesAtual = dividaMesAtual.add(pedido.getValorTotal());
                } else if (mesEmissao.equals(mesAnterior)) {
                    dividaMesAnterior = dividaMesAnterior.add(pedido.getValorTotal());
                }
            } else if ("PAGO".equalsIgnoreCase(pedido.getStatus())) {
                totalPedidosPagos++;
            }
        }
        
        BigDecimal saldoCredito = cliente.getSaldoCredito() != null ? cliente.getSaldoCredito() : BigDecimal.ZERO;
        BigDecimal dividaTotalLiquida = dividaTotal.subtract(saldoCredito);
        if (dividaTotalLiquida.compareTo(BigDecimal.ZERO) < 0) {
            dividaTotalLiquida = BigDecimal.ZERO;
        }

        return ClienteFinanceiroResponse.builder()
                .clienteResponse(mapToResponse(cliente))
                .dividaTotal(dividaTotalLiquida)
                .dividaMesAtual(dividaMesAtual)
                .dividaMesAnterior(dividaMesAnterior)
                .totalPedidosPendentes(totalPedidosPendentes)
                .totalPedidosPagos(totalPedidosPagos)
                .saldoCredito(saldoCredito)
                .historicoPedidos(pedidosResponse)
                .build();
    }

    /**
     * Abate a dívida de um cliente usando pagamento e saldo de crédito
     * @param clienteId ID do cliente
     * @param request Contém o valor pago
     * @return AbaterDividaResponse com resultado da operação
     */
    @Transactional
    public AbaterDividaResponse abaterDivida(Integer clienteId, AbaterDividaRequest request) {
        Cliente cliente = getClienteEntity(clienteId);
        
        // Validar valor pago
        if (request.getValorPago() == null || request.getValorPago().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor pago deve ser maior que zero.");
        }
        
        BigDecimal saldoAnterior = cliente.getSaldoCredito() != null ? cliente.getSaldoCredito() : BigDecimal.ZERO;
        BigDecimal valorDisponivel = request.getValorPago().add(saldoAnterior);
        
        // Buscar pedidos PENDENTE ordenados por dataEmissao ASC (FIFO)
        List<Pedido> pedidosPendentes = pedidoRepository.findByClienteIdAndStatusOrderByDataEmissaoAsc(
                clienteId, "PENDENTE");
        
        List<Integer> pedidosQuitados = new ArrayList<>();
        BigDecimal valorUtilizado = BigDecimal.ZERO;
        
        // Iterar pelos pedidos FIFO
        for (Pedido pedido : pedidosPendentes) {
            if (valorDisponivel.compareTo(pedido.getValorTotal()) >= 0) {
                // Marcar como PAGO
                pedido.setStatus("PAGO");
                pedidoRepository.save(pedido);
                
                // Atualizar métricas
                pedidosQuitados.add(pedido.getId());
                valorDisponivel = valorDisponivel.subtract(pedido.getValorTotal());
                valorUtilizado = valorUtilizado.add(pedido.getValorTotal());
            } else {
                // Parar pois não tem valor suficiente para quitar este pedido
                break;
            }
        }
        
        // Atualizar saldo de crédito do cliente
        cliente.setSaldoCredito(valorDisponivel);
        clienteRepository.save(cliente);
        
        // Recalcular dívida total após atualizações
        BigDecimal novaDividaTotal = BigDecimal.ZERO;
        List<Pedido> pedidosRestantes = pedidoRepository.findByClienteIdAndStatusOrderByDataEmissaoAsc(
                clienteId, "PENDENTE");
        
        for (Pedido pedido : pedidosRestantes) {
            novaDividaTotal = novaDividaTotal.add(pedido.getValorTotal());
        }
        
        return AbaterDividaResponse.builder()
                .pedidosQuitados(pedidosQuitados)
                .valorUtilizado(valorUtilizado)
                .creditoAdicionado(request.getValorPago())
                .novoSaldoCredito(valorDisponivel)
                .novaDividaTotal(novaDividaTotal)
                .build();
    }

    // --- Métodos Auxiliares Privados (Clean Code) ---

    private Cliente getClienteEntity(Integer id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
    }

    /**
     * Valida o request conforme o tipo de cliente
     * @param request Dados do cliente a validar
     * @param clienteId ID do cliente sendo atualizado, ou null se for criação
     */
    private void validarClienteRequest(ClienteRequest request, Integer clienteId) {
        if (request == null || request.getTipoPessoa() == null) {
            throw new IllegalArgumentException("Tipo de pessoa é obrigatório.");
        }

        String tipoPessoa = request.getTipoPessoa();

        if ("FISICA".equalsIgnoreCase(tipoPessoa)) {
            validarClientePF(request, clienteId);
        } else if ("JURIDICA".equalsIgnoreCase(tipoPessoa)) {
            validarClientePJ(request);
        } else {
            throw new IllegalArgumentException("Tipo de pessoa inválido. Use 'FISICA' ou 'JURIDICA'.");
        }
    }

    /**
     * Valida campos específicos de Pessoa Física
     * @param request Dados do cliente a validar
     * @param clienteId ID do cliente sendo atualizado, ou null se for criação
     */
    private void validarClientePF(ClienteRequest request, Integer clienteId) {
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

        // Verifica duplicação de nome para PF (ignora o cliente atual se for update)
        var clienteExistente = clienteRepository
                .findByRazaoSocialIgnoreCaseAndTipoPessoaAndIsActiveTrue(
                        request.getRazaoSocial().trim(), "FISICA");

        if (clienteExistente.isPresent()) {
            // Se for update, ignora se for o mesmo cliente
            if (clienteId == null || !clienteExistente.get().getId().equals(clienteId)) {
                throw new IllegalArgumentException("Já existe um cliente Pessoa Física com este nome.");
            }
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

        // Armazena documento SEM formatação (apenas dígitos)
        if ("FISICA".equalsIgnoreCase(request.getTipoPessoa()) && request.getDocumento() != null) {
            String cpfSemFormatacao = ClienteFormatter.removeCpfFormatting(request.getDocumento());
            cliente.setDocumento(cpfSemFormatacao);
        } else if ("JURIDICA".equalsIgnoreCase(request.getTipoPessoa()) && request.getDocumento() != null) {
            String cnpjSemFormatacao = ClienteFormatter.removeCnpjFormatting(request.getDocumento());
            cliente.setDocumento(cnpjSemFormatacao);
        } else {
            cliente.setDocumento(null);
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

    /**
     * Mapeia uma entidade Pedido para PedidoResponse
     * @param pedido A entidade Pedido
     * @return PedidoResponse com dados formatados
     */
    private PedidoResponse mapPedidoToResponse(Pedido pedido) {
        List<ItemPedido> itens = itemPedidoRepository.findByPedido(pedido);
        
        List<ItemPedidoResponse> itensResponse = itens.stream().map(item ->
                ItemPedidoResponse.builder()
                        .id(item.getId())
                        .produtoId(item.getProduto().getId())
                        .produtoDescricao(item.getProduto().getDescricao())
                        .quantidade(item.getQuantidade())
                        .valorUnitario(item.getValorUnitario())
                        .valorTotal(item.getValorTotal())
                        .custoUnitario(item.getCustoUnitario())
                        .build()
        ).toList();
        
        return PedidoResponse.builder()
                .id(pedido.getId())
                .naturezaOperacao(pedido.getNaturezaOperacao().getDescricao())
                .clienteNome(pedido.getCliente() != null ? pedido.getCliente().getRazaoSocial() : "Consumidor Final")
                .documentoReferencia(pedido.getDocumentoReferencia())
                .valorTotal(pedido.getValorTotal())
                .status(pedido.getStatus())
                .dataEmissao(pedido.getDataEmissao())
                .itens(itensResponse)
                .build();
    }
}
