-- Seed: Datos de ejemplo para desarrollo

insert into Moragas.transactions (type, amount, description, category, user_name, raw_message, created_at) values
  ('egreso', 5000, 'carne', 'comida', null, 'gasté 5.000 en carne', '2025-05-01T12:00:00Z'),
  ('egreso', 300000, 'arriendo', 'arriendo', null, 'gasto por 300000 arriendo', '2025-05-02T10:00:00Z'),
  ('ingreso', 50000, 'agregó 50000', 'otro', 'juan', 'juan agregó 50000', '2025-05-03T15:00:00Z'),
  ('ingreso', 250000, 'sueldo', 'salario', null, 'recibí 250000 de sueldo', '2025-05-01T08:00:00Z'),
  ('egreso', 15000, 'pasaje', 'transporte', null, 'gasté 15.000 en pasaje', '2025-05-04T09:00:00Z'),
  ('egreso', 45000, 'cuenta de luz', 'servicios', null, 'pagué 45.000 de luz', '2025-05-05T14:00:00Z'),
  ('egreso', 25000, 'almuerzo', 'comida', null, 'gasté 25.000 en almuerzo', '2025-05-06T13:00:00Z'),
  ('ingreso', 120000, 'trabajo freelance', 'freelance', null, 'recibí 120.000 de un trabajo freelance', '2025-05-10T11:00:00Z');
