
import { Model, HTTPOptions, RelationType, HTTP, HTTPResponse } from '../Library/Index';
import { Post } from './Post';
import { Posts } from './Posts';
import { UserMe } from './UserMe';


interface Props {
}

@Model.relations({
    posts: {
        type: RelationType.HasMany,
        reverseProp: 'homeContent',
        model: Post,
        collection: Posts,
    },
    user: {
        type: RelationType.HasOne,
        reverseProp: 'homeContent',
        model: UserMe,
    }
})
@Model.noServer
export class HomeContent extends Model<Props> {
    public findUsers(query: string) {
        HTTP.get('/users', {
                query,
            })
            .then((response) => {
                console.log(response);
            })
    }
}
