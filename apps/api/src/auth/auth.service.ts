import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { AuthResponse, UserSafe, JwtPayload } from '@quietdash/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Create default display settings
    await this.prisma.displaySettings.create({
      data: {
        userId: user.id,
      },
    });

    // Create default dashboard
    await this.prisma.dashboard.create({
      data: {
        userId: user.id,
        name: 'Default Dashboard',
        isActive: true,
      },
    });

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async validateUser(userId: string): Promise<UserSafe | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  private generateToken(userId: string, email: string): string {
    const payload: JwtPayload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any): UserSafe {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
