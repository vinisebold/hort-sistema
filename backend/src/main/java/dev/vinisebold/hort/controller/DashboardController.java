package dev.vinisebold.hort.controller;

import dev.vinisebold.hort.dto.response.DashboardResumoResponse;
import dev.vinisebold.hort.dto.response.TopClienteResponse;
import dev.vinisebold.hort.dto.response.TopProdutoResponse;
import dev.vinisebold.hort.dto.response.VendasPeriodoResponse;
import dev.vinisebold.hort.service.DashboardService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

  private final DashboardService dashboardService;

  @GetMapping("/resumo")
  public ResponseEntity<DashboardResumoResponse> getResumo(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getResumo(periodo));
  }

  @GetMapping("/vendas-por-dia")
  public ResponseEntity<List<VendasPeriodoResponse>> getVendasPorDia(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getVendasPorDia(periodo));
  }

  @GetMapping("/vendas-por-mes")
  public ResponseEntity<List<VendasPeriodoResponse>> getVendasPorMes(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getVendasPorMes(periodo));
  }

  @GetMapping("/top-produtos-vendidos")
  public ResponseEntity<List<TopProdutoResponse>> getTopProdutosVendidos(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getTop10ProdutosMaisVendidos(periodo));
  }

  @GetMapping("/top-produtos-lucrativos")
  public ResponseEntity<List<TopProdutoResponse>> getTopProdutosLucrativos(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getTop10ProdutosMaisLucrativos(periodo));
  }

  @GetMapping("/top-clientes-fieis")
  public ResponseEntity<List<TopClienteResponse>> getTopClientesFieis(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getTop10ClientesMaisFieis(periodo));
  }

  @GetMapping("/top-clientes-lucrativos")
  public ResponseEntity<List<TopClienteResponse>> getTopClientesLucrativos(
      @RequestParam(required = false, defaultValue = "HOJE") String periodo) {
    return ResponseEntity.ok(dashboardService.getTop10ClientesMaisLucrativos(periodo));
  }
}
