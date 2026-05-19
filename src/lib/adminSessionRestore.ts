import type { AppDispatch } from '@/store';
import { adminRefreshToken } from '@/store/slices/adminSlice';

let adminRefreshInFlight: ReturnType<AppDispatch> | null = null;

/** Un singur refresh admin în flight (Strict Mode + layout + protected route). */
export function dispatchAdminSessionRestoreOnce(dispatch: AppDispatch) {
  if (!adminRefreshInFlight) {
    adminRefreshInFlight = dispatch(adminRefreshToken()).finally(() => {
      adminRefreshInFlight = null;
    });
  }
  return adminRefreshInFlight;
}
