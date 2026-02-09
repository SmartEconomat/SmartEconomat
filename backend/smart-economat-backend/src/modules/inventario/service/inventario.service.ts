import { Inventario } from "../inventario.entity/inventario.entity";
import { Inject, Injectable } from "@nestjs/common";
import { Between, Repository, ReturnDocument } from "typeorm";
import { AlertaStock } from "../dto/alertaStock.dto";
import { AlertaCaducidad } from "../dto/alertaCaducidad.dto";
import { InjectRepository } from "@nestjs/typeorm";

export class InventarioService {
    constructor(private inventarioRepository: Repository<Inventario>) {}

    async obtenerAlertasCaducidad(): Promise<AlertaCaducidad[]> {
        const hoy = new Date();
        const limite = new Date();
        limite.setDate(hoy.getDate() + 7);

        const productos = await this.inventarioRepository.find({
            where: {
                fecha_caducidad: Between(hoy, limite),
            },
        });

        return productos.map(p => ({
            id: p.id,
            fecha_caducidad: p.fecha_caducidad.toISOString(),
        }));
    }

    async obtenerAlertasStock(): Promise<AlertaStock[]> {
        const productos = await this.inventarioRepository
        .createQueryBuilder('inventario')
        .where('inventario.cantidad_actual < inventario.cantidad_minima').getMany();

        return productos.map(p => ({
            id: p.id,
            cantidad_actual: p.cantidad_actual,
            cantidad_minima: p.cantidad_minima,
        }));
    }
    
}