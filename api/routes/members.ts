import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../data/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import type { ApiResponse, Member, Coupon, MemberLevel } from '../../shared/types';

const router = Router();

router.get('/', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { level, keyword } = req.query;
  
  let members = db.getMembers();
  
  if (level) {
    members = members.filter(m => m.level === level);
  }
  
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    members = members.filter(m => 
      m.name.toLowerCase().includes(kw) || 
      m.phone.includes(kw) ||
      m.memberNo.includes(kw)
    );
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: members,
      total: members.length,
      page: 1,
      pageSize: members.length
    }
  } as ApiResponse<{ list: Member[]; total: number; page: number; pageSize: number }>);
});

router.get('/:id', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const member = db.getMemberById(id);
  
  if (!member) {
    return res.json({ code: 404, message: '会员不存在', data: null } as ApiResponse<null>);
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: member
  } as ApiResponse<Member>);
});

router.post('/:id/send-coupon', authMiddleware, roleMiddleware(2), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, type, value, condition, expireDays } = req.body;
  
  const member = db.getMemberById(id);
  if (!member) {
    return res.json({ code: 404, message: '会员不存在', data: null } as ApiResponse<null>);
  }
  
  const newCoupon: Coupon = {
    id: uuidv4(),
    name: name || '会员专享券',
    type: type || 'amount',
    value: value || 50,
    condition: condition || 200,
    expireDate: dayjs().add(expireDays || 30, 'day').format('YYYY-MM-DD'),
    status: 'unused',
  };
  
  const updated = db.updateMember(id, {
    coupons: [...member.coupons, newCoupon],
  });
  
  res.json({
    code: 200,
    message: '优惠券推送成功',
    data: updated
  } as ApiResponse<Member>);
});

router.post('/process-levels', authMiddleware, roleMiddleware(3), (req: AuthRequest, res) => {
  const members = db.getMembers();
  const levels: MemberLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const thresholds = [0, 2000, 5000, 10000, 20000];
  
  const updatedMembers: Member[] = [];
  const levelChanges: { memberId: string; memberName: string; oldLevel: MemberLevel; newLevel: MemberLevel }[] = [];
  
  members.forEach(member => {
    let newLevelIdx = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (member.totalSpent >= thresholds[i]) {
        newLevelIdx = i;
        break;
      }
    }
    
    const newLevel = levels[newLevelIdx];
    if (newLevel !== member.level) {
      levelChanges.push({
        memberId: member.id,
        memberName: member.name,
        oldLevel: member.level,
        newLevel: newLevel,
      });
      
      const updated = db.updateMember(member.id, { level: newLevel });
      if (updated) {
        updatedMembers.push(updated);
      }
    }
  });
  
  res.json({
    code: 200,
    message: '会员等级处理完成',
    data: {
      processed: updatedMembers.length,
      changes: levelChanges,
    }
  } as ApiResponse<{ processed: number; changes: { memberId: string; memberName: string; oldLevel: MemberLevel; newLevel: MemberLevel }[] }>);
});

export default router;
