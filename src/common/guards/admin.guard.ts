import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role?: UserRole;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new ForbiddenException('User not found in request');
    }

    if (request.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access restricted to admin users');
    }

    return true;
  }
}
