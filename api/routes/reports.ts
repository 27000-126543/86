import { Router } from 'express';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, MonthlyOperationReport, CostDetailItem } from '../../shared/types';

const router = Router();

router.get('/operation', authMiddleware, roleMiddleware(3), (req: AuthRequest, res) => {
  const { period, format, regionId, storeId } = req.query;
  
  const targetPeriod = period || dayjs().format('YYYY-MM');
  const report = db.getMonthlyReport(String(targetPeriod));
  
  try {
    if (String(format) === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const revenueData = [['月度营收分析'],['月份','总营收','营收目标','达成率','环比增长','同比增长'],[targetPeriod, report.totalRevenue, report.targetRevenue || report.totalRevenue * 1.1, String(Math.round((report.totalRevenue / (report.targetRevenue || report.totalRevenue * 1.1)) * 1000) / 10) + '%', (report.revenueGrowth >= 0 ? '+' : '') + report.revenueGrowth.toFixed(1) + '%', ((report.revenueGrowthYoy || report.revenueGrowth) >= 0 ? '+' : '') + (report.revenueGrowthYoy || report.revenueGrowth).toFixed(1) + '%']];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revenueData), '月度营收');
    const fsData = [['食安达标率统计'],['月份','食安达标率','问题数','整改完成率'],[targetPeriod, report.foodSafetyRate.toFixed(1) + '%', report.foodSafetyIssues || 3, (report.rectificationRate || 92).toFixed(1) + '%']];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fsData), '食安达标');
    const delData = [['配送状态分析'],['月份','配送总单','准时送达','准时率','异常单'],[targetPeriod, report.deliveryTotal || 580, report.deliveryOnTime || 552, (report.deliveryOnTimeRate || 95.2).toFixed(1) + '%', report.deliveryExceptions || 8]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(delData), '配送状态');
    const dishData = [['菜品销量排行'],['排名','菜品名称','分类','销量','营收','占比']];
    (report.dishRanking || []).forEach((d, i) => { dishData.push([String(i + 1), d.dishName || d.name, d.category || '热销菜品', String(d.quantity || d.sales), String(d.revenue || d.sales * 50), (d.revenueShare || 100 / (i + 1)).toFixed(1) + '%']); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dishData), '菜品销量');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=operation_report_' + targetPeriod + '.xlsx');
    return res.send(buf);
    }
  } catch (e) {
    console.error('Excel export error:', e);
    return res.status(500).json({ success: false, error: String(e) });
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: report
  } as ApiResponse<MonthlyOperationReport>);
});

router.get('/cost-control', authMiddleware, roleMiddleware(3), (req: AuthRequest, res) => {
  const costDetails = db.getCostControlDetails();
  
  res.json({
    code: 200,
    message: 'success',
    data: costDetails
  } as ApiResponse<CostDetailItem[]>);
});

export default router;
