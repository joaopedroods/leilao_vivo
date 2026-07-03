Write-Host "Criando schemas dos bancos de dados..."

Get-Content services/leiloes/src/database/schema.sql | docker exec -i leilaovivo-postgres-leiloes psql -U postgres -d leiloes_db
Write-Host "✓ leiloes_db"

Get-Content services/contas-carteira/src/db/schema.sql | docker exec -i leilaovivo-postgres-carteira psql -U leilaovivo -d contas_carteira
Write-Host "✓ contas_carteira"

Get-Content services/notificacoes/src/db/schema.sql | docker exec -i leilaovivo-postgres-notificacoes psql -U leilaovivo -d notificacoes
Write-Host "✓ notificacoes"

Write-Host "Setup concluído!"