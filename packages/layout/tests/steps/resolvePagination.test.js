import { Text } from '@react-pdf/primitives';
import resolvePagination from '../../src/steps/resolvePagination';
import resolveDimensions from '../../src/steps/resolveDimensions';

// dimensions is required by pagination step and them are calculated here
const calcLayout = node => resolvePagination(resolveDimensions(node));

describe('pagination step', () => {
  test('should stretch absolute block to full page size', () => {
    const root = {
      type: 'DOCUMENT',
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 100,
            height: 100,
          },
          children: [
            {
              type: 'VIEW',
              box: {},
              style: {
                position: 'absolute',
                width: '50%',
                top: 0,
                bottom: 0,
              },
              props: {},
              children: [],
            },
            {
              type: 'TEXT',
              box: {},
              style: {},
              props: {},
              children: [
                {
                  type: 'TEXT_INSTANCE',
                  value: 'hello world',
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const page = layout.children[0];
    const view = layout.children[0].children[0];

    expect(page.box.height).toBe(100);
    expect(view.box.height).toBe(100);
  });

  test('should keep given page size', async () => {
    const root = {
      type: 'DOCUMENT',
      children: [
        {
          type: 'PAGE',
          box: {},
          style: { width: 200, height: 500 },
          children: [
            {
              type: 'VIEW',
              box: {},
              style: {},
              props: {
                fixed: true,
                render: () => <Text style={{ height: 50 }}>Header</Text>,
              },
              children: [],
            },
            {
              type: 'VIEW',
              box: {},
              style: { height: 900 },
              props: {},
              children: [],
            },
            {
              type: 'TEXT',
              box: {},
              style: {},
              props: {},
              children: [
                {
                  type: 'TEXT_INSTANCE',
                  value: 'Hello World',
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = await calcLayout(root);

    const [page1, page2, page3] = layout.children;
    const [page1view1, page1view2] = page1.children;

    expect(page1.box.height).toBe(500);
    expect(page1view1.box.height).toBe(50); // header
    expect(page1view2.box.height).toBeCloseTo(450, 4); // 900 height view

    const [page2view1, page2view2] = page2.children;
    expect(page2.box.height).toBe(500);
    expect(page2view1.box.height).toBe(50); // header
    expect(page2view2.box.height).toBeCloseTo(450, 4); // 900 height view

    expect(page3).toBeDefined();
    const [page3view1, page3view2] = page3.children;
    expect(page3.box.height).toBe(500);
    expect(page3view1.box.height).toBe(50); // header
    expect(page3view2.box.height).toBeCloseTo(20, 0); // text
  });

  test('should force new height for split nodes', () => {
    const root = {
      type: 'DOCUMENT',
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 15,
            height: 60,
          },

          children: [
            {
              type: 'VIEW',
              box: {},
              style: {},
              props: {},
              children: [
                {
                  type: 'TEXT',
                  box: {},
                  style: {},
                  props: {},
                  children: [
                    {
                      type: 'TEXT_INSTANCE',
                      value: 'a a a a',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const view1 = layout.children[0].children[0];
    const view2 = layout.children[1].children[0];

    expect(view1.box.height).toBe(60);
    expect(view2.box.height).not.toBe(60);
  });

  test('should force new height for split nodes with fixed height', () => {
    const root = {
      type: 'DOCUMENT',
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 5,
            height: 60,
          },

          children: [
            {
              type: 'VIEW',
              box: {},
              style: { height: 130 },
              props: {},
              children: [],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    const view1 = layout.children[0].children[0];
    const view2 = layout.children[1].children[0];
    const view3 = layout.children[2].children[0];

    expect(view1.box.height).toBe(60);
    expect(view2.box.height).toBe(60);
    expect(view3.box.height).toBe(10);
  });

  test('should not wrap page with false wrap prop', () => {
    const root = {
      type: 'DOCUMENT',
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 5,
            height: 60,
          },
          props: {
            wrap: false,
          },
          children: [
            {
              type: 'VIEW',
              box: {},
              style: { height: 130 },
              props: {},
              children: [],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);

    expect(layout.children.length).toBe(1);
  });

  test('should break on a container whose children can not fit on a page', () => {
    const root = {
      type: 'DOCUMENT',
      children: [
        {
          type: 'PAGE',
          box: {},
          style: {
            width: 5,
            height: 60,
          },

          children: [
            {
              type: 'VIEW',
              box: {},
              style: {
                width: 5,
                height: 40,
              },
              props: {},
              children: [],
            },
            {
              type: 'VIEW',
              box: {},
              style: {
                width: 5,
              },
              props: {},
              children: [
                {
                  type: 'VIEW',
                  box: {},
                  style: {
                    height: 40,
                  },
                  props: {
                    wrap: false,
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };

    const layout = calcLayout(root);
    console.log(layout.children[0].children);

    const page1 = layout.children[0];
    const page2 = layout.children[1];

    // Only the first view is displayed on the first page
    expect(page1.children.length).toBe(1);
    // The second page displays the second wrapper, with its full height
    expect(page2.children.length).toBe(1);
    expect(page2.children[0].box.height).toBe(40);
  });
});
