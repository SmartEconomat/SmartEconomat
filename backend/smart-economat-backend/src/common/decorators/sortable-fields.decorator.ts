import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export const SortableFields = (allowedFields: string[]): ParameterDecorator =>
  createParamDecorator((data: string[], ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ query: PaginationQueryDto }>();
    const { sortBy } = request.query;

    if (sortBy && !data.includes(sortBy)) {
      throw new BadRequestException(
        `Campo de ordenación inválido: "${sortBy}". Campos permitidos: ${data.join(', ')}`
      );
    }

    return request.query;
  })(allowedFields);
