// Tiny in-memory collection used ONLY when MongoDB is unreachable,
// so the whole app keeps working out of the box.
const crypto = require('crypto');

const matches = (doc, filter = {}) => {
  for (const [k, v] of Object.entries(filter)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (v.$in && !v.$in.includes(doc[k])) return false;
      else if (v.$regex && !new RegExp(v.$regex, v.$options || '').test(String(doc[k] ?? ''))) return false;
      else if (v.$ne !== undefined && doc[k] === v.$ne) return false;
      else if (v.$gte !== undefined && !(doc[k] >= v.$gte)) return false;
    } else if (doc[k] !== v) return false;
  }
  return true;
};

const applySort = (arr, sort) => {
  if (!sort) return arr;
  const [[key, dir]] = Object.entries(sort);
  return [...arr].sort((a, b) => ((a[key] > b[key] ? 1 : -1) * (dir === -1 ? -1 : 1)));
};

function memCollection(name) {
  const rows = [];
  const api = {
    _mem: true,
    async find(filter = {}, _p, opts = {}) {
      let out = rows.filter((r) => matches(r, filter));
      out = applySort(out, opts.sort);
      if (opts.skip) out = out.slice(opts.skip);
      if (opts.limit) out = out.slice(0, opts.limit);
      return out.map((r) => ({ ...r }));
    },
    async findOne(filter = {}) {
      const d = rows.find((r) => matches(r, filter));
      return d ? { ...d } : null;
    },
    async findById(id) {
      const d = rows.find((r) => String(r._id) === String(id));
      return d ? { ...d } : null;
    },
    async create(data) {
      const now = new Date();
      const doc = {
        _id: data._id || crypto.randomBytes(12).toString('hex'),
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now,
      };
      rows.push(doc);
      return { ...doc };
    },
    async findByIdAndUpdate(id, update, opts = {}) {
      const i = rows.findIndex((r) => String(r._id) === String(id));
      if (i === -1) return null;
      const set = update.$set || update;
      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          rows[i][k] = [...(rows[i][k] || []), v];
        }
      }
      rows[i] = { ...rows[i], ...set, updatedAt: new Date() };
      return opts.new ? { ...rows[i] } : { ...rows[i] };
    },
    async findOneAndUpdate(filter, update, opts = {}) {
      const found = rows.find((r) => matches(r, filter));
      if (!found) {
        if (opts.upsert) return api.create({ ...(filter || {}), ...(update.$set || update) });
        return null;
      }
      return api.findByIdAndUpdate(found._id, update, { new: true });
    },
    async findByIdAndDelete(id) {
      const i = rows.findIndex((r) => String(r._id) === String(id));
      if (i === -1) return null;
      return rows.splice(i, 1)[0];
    },
    async deleteMany(filter = {}) {
      let n = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (matches(rows[i], filter)) { rows.splice(i, 1); n++; }
      }
      return { deletedCount: n };
    },
    async countDocuments(filter = {}) {
      return rows.filter((r) => matches(r, filter)).length;
    },
  };
  return api;
}

module.exports = { memCollection };
