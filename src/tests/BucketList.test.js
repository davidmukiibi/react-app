import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import BucketList from '../components/BucketList';

jest.dontMock('../components/BucketList');

describe("Bucketlist component", () => {
    
    it("Shows no content mesage if no buckets are present.", () => {
        let root = shallow(<BucketList />);

        expect(root.find('div.no-buckets')).to.have.lengthOf(1);

        root = shallow(<BucketList buckets={[]} />);

        expect(root.find('div.no-buckets')).to.have.lengthOf(1);
    });

    it("Renders bucket list", () => {
        let buckets = [
            {
                name:"PHP bucket", 
                id: 1,
                description: "desc"
            },
            {
                name: 'Java bucket',
                id: 2, 
                description:"Description 1"
            }
        ];

        let root = shallow(<BucketList buckets={buckets} onItemClick={()=>{}} />);

        expect(root.find('.bucket')).to.have.lengthOf(buckets.length);
    });
});
