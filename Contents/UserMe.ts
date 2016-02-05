
import { HTTP, CollectionResponse, RelationType, Collection } from '../Library/Index';
import { User } from './User';

interface Resource {
    url: string;
    width: number;
    height: number;
}

interface UserImage {
    tiny: Resource;
    medium: Resource;
    large: Resource;
}

export interface UserResult {
    id: string;
    name: string;
    username: string;
    image: UserImage;
}

@User.noParentURL
export class UserMe extends User {
    protected getModelURL(): string {
        return '/users/me';
    }

    public findAll(query: string, limit: number): Promise<UserResult[]> {
        return HTTP.get<CollectionResponse<UserResult>>('/users/search', {
                query: {
                    q: query,
                    limit,
                }
            })
            .then((response) => {
                return Promise.resolve(response.body.collection);
            });
    }
}
