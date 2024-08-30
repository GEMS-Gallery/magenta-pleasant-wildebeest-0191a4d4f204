export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  return IDL.Service({
    'getBalance' : IDL.Func([], [IDL.Nat], ['query']),
    'getLastSpinResult' : IDL.Func([], [IDL.Opt(IDL.Nat)], ['query']),
    'getSpinHistory' : IDL.Func([], [IDL.Vec(IDL.Nat)], ['query']),
    'placeBet' : IDL.Func([IDL.Text, IDL.Nat], [Result_1], []),
    'spin' : IDL.Func([], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
