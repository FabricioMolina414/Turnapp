const monthlyMetrics = [
  { month: '2024-01', confirmed: 64, cancelled: 6, revenue: 285600 },
  { month: '2024-02', confirmed: 72, cancelled: 5, revenue: 321000 },
  { month: '2024-03', confirmed: 78, cancelled: 4, revenue: 339800 },
  { month: '2024-04', confirmed: 83, cancelled: 7, revenue: 368200 },
  { month: '2024-05', confirmed: 91, cancelled: 5, revenue: 401500 },
  { month: '2024-06', confirmed: 88, cancelled: 3, revenue: 389200 },
];

function listMonthlyMetrics() {
  return monthlyMetrics;
}

module.exports = {
  monthlyMetrics,
  listMonthlyMetrics,
};
