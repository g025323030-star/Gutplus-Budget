import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './config/data-source';
import app from './app';
import { categoryService } from './services';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established successfully');

    try {
      await categoryService.ensureGlobalDefaults();
      console.log('Global default categories ensured');
    } catch (seedError) {
      console.warn('Could not ensure global default categories:', seedError);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();