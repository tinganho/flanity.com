
(global as any).inServer = true;
(global as any).inClient = true;

import { runImageTests } from './ImageTestRunner';

runImageTests();