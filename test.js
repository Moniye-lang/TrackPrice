import http from 'k6/http'
import { sleep, check } from 'k6'

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://127.0.0.1:3001/api/products')
  check(res, { 'status was 200': (r) => r.status === 200 });
  
  http.get('http://127.0.0.1:3001/')
  sleep(1)
}