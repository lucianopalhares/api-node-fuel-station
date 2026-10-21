-- acelera a exportacao ordenada por atualizacao e o cursor de paginacao.
CREATE INDEX IF NOT EXISTS stations_updated_at_id_desc_idx
  ON stations (updated_at DESC, id DESC);
