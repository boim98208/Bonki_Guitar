namespace project
{

struct DoubleTracking_networkdata: public scriptnode::dll::InterpretedNetworkData
{
	String getId() const override
	{
		return "DoubleTracking";
	}
	bool isModNode() const override
	{
		return false;
	}
	String getNetworkData() const override
	{
		return "233.nT6K8C1e.zuA.HTCrPBDMaS.OLYChsX+BlxHkEkoogvnAEY0fIzyTUUUCsqw4zvwH8yuycrHuPD86gN.z93.sOH73vvoATCH0pFjOSOwvW0ipZXH+.FpUCHeioBKowfn4O70w1B+3HYpzPQW7HElDzAoUjcQI3vDYagi9pJxOogP9xlDdiwRK0qaLN1bKsf7RQNxlmKt3G.jum3hx7qZUqJP9liAesjCQiMs3WCckGv3bnKx6PgD4mdtLwNJP.PefS.vMHpj+1sQvLPoYVSLb+.JGp3OHnFZ.rSeh.vMVbYvBCoIArnuPT.";
	}
};
}

