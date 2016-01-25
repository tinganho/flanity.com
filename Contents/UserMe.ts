
import { User } from './User';

export class UserMe extends User {
    protected getModelURL(): string {
        return '/users/me';
    }
}
