import { Request, Response } from 'express';
import { success, error } from '../../utils/response';

const API_BASE = 'https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2';

interface ExternalCompanyResult {
  name: string;
  bizNumber: string;
  representative: string;
  address: string;
  phone: string;
}

function formatBizNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return raw;
}

export async function lookupCompanies(req: Request, res: Response) {
  try {
    const q = (req.query.q as string || '').trim();
    if (q.length < 2) {
      return error(res, 'VALIDATION', '검색어는 2자 이상 입력해주세요', 400);
    }

    const apiKey = process.env.DATA_GO_KR_API_KEY;
    if (!apiKey) {
      return error(res, 'CONFIG', 'DATA_GO_KR_API_KEY가 설정되지 않았습니다', 500);
    }

    const params = new URLSearchParams({
      serviceKey: apiKey,
      resultType: 'json',
      pageNo: '1',
      numOfRows: '20',
      corpNm: q,
    });

    const response = await fetch(`${API_BASE}?${params.toString()}`);
    if (!response.ok) {
      return error(res, 'EXTERNAL', `공공데이터 API 오류 (${response.status})`, 502);
    }

    const json = await response.json() as Record<string, unknown>;
    const body = (json?.response as Record<string, unknown>)?.body as Record<string, unknown>;
    if (!body || (body.totalCount as number) === 0) {
      return success(res, []);
    }

    const rawItems = (body.items as Record<string, unknown>)?.item;
    if (!rawItems) return success(res, []);

    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    const results: ExternalCompanyResult[] = items.map((item: Record<string, unknown>) => ({
      name: (item.corpNm as string) || '',
      bizNumber: item.bzno ? formatBizNumber(item.bzno as string) : '',
      representative: (item.enpRprFnm as string) || '',
      address: (item.enpBsadr as string) || '',
      phone: (item.enpTlno as string) || '',
    }));

    return success(res, results);
  } catch {
    return error(res, 'INTERNAL', '업체 검색에 실패했습니다', 500);
  }
}
