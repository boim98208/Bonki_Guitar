#pragma once

// These will improve the readability of the connection definition

#define getT(Idx) template get<Idx>()
#define connectT(Idx, target) template connect<Idx>(target)
#define getParameterT(Idx) template getParameter<Idx>()
#define setParameterT(Idx, value) template setParameter<Idx>(value)
#define setParameterWT(Idx, value) template setWrapParameter<Idx>(value)
using namespace scriptnode;
using namespace snex;
using namespace snex::Types;

namespace DCFilterOutput_impl
{
// ======================| Node & Parameter type declarations |======================

template <int NV>
using DCFilterOutput_t_ = container::chain<parameter::empty, 
                                           wrap::fix<2, filters::biquad<NV>>, 
                                           filters::biquad<NV>>;

// =========================| Root node initialiser class |=========================

template <int NV> struct instance: public DCFilterOutput_impl::DCFilterOutput_t_<NV>
{
	
	struct metadata
	{
		static const int NumTables = 0;
		static const int NumSliderPacks = 0;
		static const int NumAudioFiles = 0;
		static const int NumFilters = 0;
		static const int NumDisplayBuffers = 0;
		
		SNEX_METADATA_ID(DCFilterOutput);
		SNEX_METADATA_NUM_CHANNELS(2);
		SNEX_METADATA_ENCODED_PARAMETERS(2)
		{
			0x0000, 0x0000
		};
		SNEX_METADATA_ENCODED_MOD_INFO(2)
		{
			0x3D3B, 0x003E
		};
	};
	
	instance()
	{
		// Node References ---------------------------------------------------------
		
		auto& biquad = this->getT(0);  // filters::biquad<NV>
		auto& biquad1 = this->getT(1); // filters::biquad<NV>
		
		// Default Values ----------------------------------------------------------
		
		biquad.setParameterT(0, 20.);  // filters::biquad::Frequency
		biquad.setParameterT(1, 0.71); // filters::biquad::Q
		biquad.setParameterT(2, 0.);   // filters::biquad::Gain
		biquad.setParameterT(3, 0.01); // filters::biquad::Smoothing
		biquad.setParameterT(4, 1.);   // filters::biquad::Mode
		biquad.setParameterT(5, 1.);   // filters::biquad::Enabled
		
		biquad1.setParameterT(0, 20.);  // filters::biquad::Frequency
		biquad1.setParameterT(1, 0.71); // filters::biquad::Q
		biquad1.setParameterT(2, 0.);   // filters::biquad::Gain
		biquad1.setParameterT(3, 0.01); // filters::biquad::Smoothing
		biquad1.setParameterT(4, 1.);   // filters::biquad::Mode
		biquad1.setParameterT(5, 1.);   // filters::biquad::Enabled
		
	}
	
	static constexpr bool isPolyphonic() { return NV > 1; };
	
	static constexpr bool hasTail() { return true; };
	
	static constexpr bool isSuspendedOnSilence() { return false; };
};
}

#undef getT
#undef connectT
#undef setParameterT
#undef setParameterWT
#undef getParameterT
// ==============================| Public Definition |==============================

namespace project
{
// polyphonic template declaration

template <int NV>
using DCFilterOutput = wrap::node<DCFilterOutput_impl::instance<NV>>;
}


