import { DataSource } from 'typeorm';
import { dbConfig } from './database.config';

export const AppDataSource = new DataSource(dbConfig);
