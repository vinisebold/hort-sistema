package dev.vinisebold.hort.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false)
  private String tipoPessoa;

  @Column(unique = true)
  private String documento;

  @Column(nullable = false)
  private String razaoSocial;

  private String nomeFantasia;

  private String endereco;

  private String contato;

  @Column(nullable = false)
  private Boolean isActive = true;

  @Column(precision = 10, scale = 2)
  private BigDecimal saldoCredito = BigDecimal.ZERO;

  @CreationTimestamp
  @Column(updatable = false)
  private LocalDateTime createdAt;
}
