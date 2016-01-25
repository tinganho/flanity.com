
import { Model, relations, RelationType, RequestInfo } from '../Library/Index';
import { Topic } from './Topic';
import { Topics } from './Topics';

interface Props {
    id: string;
    topics?: Topic[];
}

interface Params {
    username: string;
}

@relations({
    topics: {
        type: RelationType.HasMany,
        reverseProp: 'user',
        model: Topic,
        collection: Topics,
    }
})
export class User extends Model<Props> {
    protected getModelURL(requestInfo: RequestInfo<Params, any>): string {
        if (requestInfo.params.username) {
            return '/users/@' + requestInfo.params.username;
        }
        return '/users/' + (requestInfo.cookies.userId || 'me');
    }
}
