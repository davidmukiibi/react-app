import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import BucketlistHeader from '../components/BucketlistHeader';

describe("BucketlistHeader component", () => {
    it("Should render", () => {
        const props = {
            currentBucket: {
                id: 223992
            }
        };

        let root = shallow(<BucketlistHeader {...props} />);
        expect(root.find('.logo-text').text()).to.contain("Bucketlist")
    });

});
