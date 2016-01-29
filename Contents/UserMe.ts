
import { User } from './User';

@User.noParentURL
export class UserMe extends User {
    protected getModelURL(): string {
        return '/users/me';
    }
}
