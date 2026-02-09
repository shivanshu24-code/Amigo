const buildCommentTree = (comments) => {
  const map = {};
  const roots = [];

  comments.forEach((c) => {
    map[c._id.toString()] = {
      ...c.toObject(),
      replies: []
    };
  });

  comments.forEach((c) => {
    if (c.parentComment) {
      const parentId = c.parentComment.toString();
      map[parentId]?.replies.push(map[c._id.toString()]);
    } else {
      roots.push(map[c._id.toString()]);
    }
  });

  return roots;
};

export default buildCommentTree;
