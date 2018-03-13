import React from 'react';
import { shallow } from 'enzyme';
import Search from '../components/Search';

describe("Search component", () => {
    it("Should render", () => {
        const results = [
            {
                id: 1
            }
        ]
        let root = shallow(<Search results={results} />);
        expect(root.find('.search-title span').text()).toContain("Search")
    });
});
