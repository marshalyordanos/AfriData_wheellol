// contract.gateway.controller.ts
// Admin: contract templates + the contract of each booking request.
// Customer: public review / e-sign page (no sign-in, the link token is the secret).
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as multer from 'multer';
import { randomBytes } from 'crypto';
import { firstValueFrom } from 'rxjs';
import { PATTERNS } from '../contracts';
import { uploadToSpaces } from '../config/cloudinary/upload';
import {
  CreateContractTemplateDto,
  CreateRentalContractDto,
  DeclineContractDto,
  SaveRentalContractDto,
  SaveSignatureDto,
  SignContractDto,
  UpdateContractTemplateDto,
} from '../rental-service/contract/contract.entity';
import { contractErrorPage, contractPublicPage } from './contract-public.page';

const headersOf = (req: any) => ({
  authorization: req.headers['authorization'] || null,
});

@ApiTags('Contracts')
@ApiBearerAuth('access-token')
@Controller()
export class ContractGatewayController {
  constructor(@Inject('RENTAL_SERVICE') private readonly client: ClientProxy) {}

  // ---------------- templates (admin) ----------------

  @Get('contract-templates')
  listTemplates(@Req() req, @Query('all') all?: string) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_LIST, {
      headers: headersOf(req),
      all,
    });
  }

  /** Logo / stamp image for templates. Returns { url }. */
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  @Post('contract-templates/upload')
  async upload(@Req() req, @UploadedFile() file?: Express.Multer.File) {
    // Same permission as editing a template: ask the service (throws if not allowed)
    await firstValueFrom(
      this.client.send(PATTERNS.CONTRACT_TEMPLATE_LIST, {
        headers: headersOf(req),
      }),
    );
    if (!file)
      throw new RpcException({ statusCode: 400, message: 'Choose an image' });
    if (!/^image\//.test(file.mimetype)) {
      throw new RpcException({
        statusCode: 400,
        message: 'Only images can be used here',
      });
    }
    try {
      const url = await uploadToSpaces(file, 'contracts/assets');
      return { success: true, message: 'Uploaded', data: { url } };
    } catch (err) {
      throw new RpcException(err.message || 'Error uploading image');
    }
  }

  @Get('contract-templates/:id')
  getTemplate(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_GET, {
      headers: headersOf(req),
      id,
    });
  }

  @Post('contract-templates')
  createTemplate(@Req() req, @Body() dto: CreateContractTemplateDto) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_CREATE, {
      headers: headersOf(req),
      data: dto,
    });
  }

  @Patch('contract-templates/:id')
  updateTemplate(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateContractTemplateDto,
  ) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_UPDATE, {
      headers: headersOf(req),
      id,
      data: dto,
    });
  }

  @Post('contract-templates/:id/duplicate')
  duplicateTemplate(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_DUPLICATE, {
      headers: headersOf(req),
      id,
    });
  }

  @Post('contract-templates/:id/default')
  setDefault(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_SET_DEFAULT, {
      headers: headersOf(req),
      id,
    });
  }

  @Delete('contract-templates/:id')
  deleteTemplate(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.CONTRACT_TEMPLATE_DELETE, {
      headers: headersOf(req),
      id,
    });
  }

  // ---------------- contract of a booking request (admin) ----------------

  @Get('rental-requests/:requestId/contracts')
  listContracts(@Req() req, @Param('requestId') requestId: string) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_LIST, {
      headers: headersOf(req),
      requestId,
    });
  }

  @Post('rental-requests/:requestId/contracts')
  createContract(
    @Req() req,
    @Param('requestId') requestId: string,
    @Body() dto: CreateRentalContractDto,
  ) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_CREATE, {
      headers: headersOf(req),
      requestId,
      data: dto,
    });
  }

  @Get('rental-contracts/:id')
  getContract(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_GET, {
      headers: headersOf(req),
      id,
    });
  }

  @Patch('rental-contracts/:id')
  saveContract(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: SaveRentalContractDto,
  ) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_SAVE, {
      headers: headersOf(req),
      id,
      data: dto,
    });
  }

  @Post('rental-contracts/:id/void')
  voidContract(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_VOID, {
      headers: headersOf(req),
      id,
    });
  }

  @Delete('rental-contracts/:id')
  deleteContract(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_DELETE, {
      headers: headersOf(req),
      id,
    });
  }

  // ---------------- customer: public review + e-sign ----------------

  /** JSON for apps: GET /contracts/view/:token/data */
  @Get('contracts/view/:token/data')
  viewData(@Param('token') token: string) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_PUBLIC_VIEW, { token });
  }

  /** The page the customer opens (browser or mobile WebView). */
  @Get('contracts/view/:token')
  async viewPage(
    @Param('token') token: string,
    @Query('app') app: string,
    @Res() res: any,
  ) {
    const nonce = randomBytes(16).toString('base64');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Contract HTML is written by admins; scripts other than ours never run.
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'none'; img-src * data: blob:; style-src 'unsafe-inline'; font-src * data:; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'`,
    );
    try {
      const out: any = await firstValueFrom(
        this.client.send(PATTERNS.RENTAL_CONTRACT_PUBLIC_VIEW, { token }),
      );
      res
        .status(200)
        .send(
          contractPublicPage(out.data, { token, nonce, inApp: app === '1' }),
        );
    } catch (err: any) {
      const status = err?.statusCode || err?.error?.statusCode || 404;
      res
        .status(status >= 400 && status < 600 ? status : 404)
        .send(
          contractErrorPage(err?.message || 'This contract link is not valid'),
        );
    }
  }

  @Post('contracts/view/:token/sign')
  sign(
    @Req() req,
    @Param('token') token: string,
    @Body() dto: SignContractDto,
  ) {
    const fwd = String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim();
    return this.client.send(PATTERNS.RENTAL_CONTRACT_PUBLIC_SIGN, {
      token,
      data: dto,
      ip: fwd || req.ip || req.socket?.remoteAddress,
      agent: req.headers['user-agent'],
    });
  }

  @Post('contracts/view/:token/decline')
  decline(@Param('token') token: string, @Body() dto: DeclineContractDto) {
    return this.client.send(PATTERNS.RENTAL_CONTRACT_PUBLIC_DECLINE, {
      token,
      data: dto,
    });
  }

  // ---------------- saved signature (mobile profile) ----------------

  @Get('me/signature')
  getMySignature(@Req() req) {
    return this.client.send(PATTERNS.MY_SIGNATURE_GET, {
      headers: headersOf(req),
    });
  }

  @Put('me/signature')
  saveMySignature(@Req() req, @Body() dto: SaveSignatureDto) {
    return this.client.send(PATTERNS.MY_SIGNATURE_SAVE, {
      headers: headersOf(req),
      data: dto,
    });
  }

  @Delete('me/signature')
  deleteMySignature(@Req() req) {
    return this.client.send(PATTERNS.MY_SIGNATURE_DELETE, {
      headers: headersOf(req),
    });
  }
}
