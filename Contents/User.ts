
import { Model, relations, defaultId, RelationType } from '../Library/Index';
import { Topic } from './Topic';
import { Topics } from './Topics';

interface Props {
    id: string;
    topics?: Topic[];
}

@relations({
    topics: {
        type: RelationType.HasMany,
        reverseProp: 'user',
        model: Topic,
        collection: Topics,
    }
})
@defaultId('me')
export class User extends Model<Props> {
}
