package dev.vinisebold.hort.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Integer id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String senhaHash;

  @Column(nullable = false, unique = true)
  private String cnpj;

  @Column(nullable = false)
  private String razaoSocial;

  @Column(nullable = false)
  private String nomeFantasia;

  @Column(nullable = false)
  private Boolean isActive = true;

  @Column(nullable = false, updatable = false)
  private LocalDateTime criadoEm = LocalDateTime.now();

  @Column(nullable = false)
  private LocalDateTime atualizadoEm = LocalDateTime.now();
}
