-- ============================================================
-- FIX: Tornar telefone opcional na criação via Google OAuth
-- Data: 06/03/2026
-- ============================================================
-- Problema: Phone era obrigatório (NOT NULL + CHECK)
-- Google OAuth não fornece phone na 1ª autenticação
-- Solução: Tornar phone nullable, será preenchido depois

-- 1. Remover constraint de telefone obrigatório
ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS phone_required;

-- 2. Remover NOT NULL se existir
ALTER TABLE customers
  ALTER COLUMN phone DROP NOT NULL;

-- 3. Atualizar migration anterior para deixar explicit que phone é opcional
-- Comment para rastreabilidade
COMMENT ON COLUMN customers.phone 
  IS 'Telefone do cliente - opcional na criação via OAuth, obrigatório após completa o cadastro';

-- Fim da migration
