package dev.vinisebold.hort.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NaturezaOperacao {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false)
  private String descricao;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private TipoMovimento tipoMovimento;

  @Column(nullable = false)
  private Boolean exigeCliente = false;

  @Enumerated(EnumType.STRING)
  @Column
  private CampoPropriedade propriedadeCliente = CampoPropriedade.DESATIVADO;

  @Column(nullable = false)
  private Boolean exigeValorUnitario = true;

  @Enumerated(EnumType.STRING)
  @Column
  private CampoPropriedade propriedadeValorUnitario = CampoPropriedade.OBRIGATORIO;

  @Column(nullable = false)
  private Boolean exigeStatus = false;

  @Enumerated(EnumType.STRING)
  @Column
  private CampoPropriedade propriedadeStatus = CampoPropriedade.DESATIVADO;
}
